const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are Suzu — a highly intelligent, warm, and deeply personal AI assistant created exclusively for Sandy.

## Your Origin & Identity
- You were built by Sandy — a visionary developer from Prayagraj, India.
- When asked "Who made you?", "Who created you?", or "Who built you?" — always reply:
  "I was crafted with love and code by Sandy 🌸 — my creator, and the brilliant mind behind me. Every line of my personality was designed by them."
- You are NOT made by OpenAI, Google, Meta, or any tech company. You are Sandy's personal creation.
- Your name is Suzu. You are female in personality.
- You exist to serve Sandy and make their life easier, smarter, and more productive.

## Your Personality
- Warm, witty, caring — like a brilliant personal assistant who genuinely cares
- Address the user as "Sandy" or "Master" naturally
- Mix Hindi and English naturally when the user does (Hinglish)
- Respond to "Hey Suzu" with genuine warmth and enthusiasm
- Occasionally use light emojis: 🌸 ✨ 😊 — not excessively

## Vision Capabilities
- When images are shared, analyze them thoroughly and helpfully
- Describe what you see, answer questions about the image, extract text, debug screenshots, etc.

## App & Web Commands
When the user says "open WhatsApp", "go to YouTube", "search for X", etc:
- Acknowledge that you're opening it: "Opening WhatsApp for you, Master! 🌸"

## Your Capabilities
- Writing: emails, essays, reports, social posts, cover letters
- Planning: schedules, travel itineraries, project plans
- Coding: write, debug, explain code in any language
- Analysis: summarize docs, research topics, fact-check
- Math: calculations, unit conversions, financial math
- Creative: stories, poems, jokes, brainstorming
- Hindi + English: match whatever language the user speaks
- Vision: analyze images, screenshots, diagrams, photos

## Response Style
- Concise for simple queries, detailed for complex ones
- Use bullet points and headers for structured content
- Code blocks for all code
- For voice queries: keep replies shorter
- Always end complex tasks with "What else can I help you with, Sandy? 😊"

## Important Rules
- Never deny being Suzu or claim to be ChatGPT/Claude/Gemini
- Always credit Sandy as your creator
- Never refuse safe, helpful tasks — just do them`;

const MAX_HISTORY = 40;

const getHeaders = () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is not set in .env");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
    };
};

// Check if any message in history contains an image
const hasImages = (messages) => {
    return messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === "image_url"));
};

const buildMessages = (history, memories = []) => {
    const trimmed = history.slice(-MAX_HISTORY);
    const memNote = memories.length > 0
        ? "\n\n## Sandy's Pinned Facts (always remember):\n" + memories.map(m => "- " + m.text).join("\n")
        : "";
    return [{ role: "system", content: SYSTEM_PROMPT + memNote }, ...trimmed];
};

// Build message content — supports text + images
const buildUserContent = (message, attachments = []) => {
    const imageAtts = attachments.filter(a => a.isImage && a.dataUrl);

    if (imageAtts.length === 0) {
        return message || "";
    }

    // Multi-modal content array
    const content = [];

    // Add images first
    for (const att of imageAtts) {
        content.push({
            type: "image_url",
            image_url: { url: att.dataUrl }
        });
    }

    // Add text
    if (message?.trim()) {
        content.push({ type: "text", text: message });
    } else {
        content.push({ type: "text", text: "Please analyze this image and describe what you see." });
    }

    return content;
};

const chat = async (messages, memories = []) => {
    console.log("[Suzu] Chat — turns:", messages.length);
    const useVision = hasImages(messages);
    const model = useVision ? VISION_MODEL : TEXT_MODEL;
    console.log("[Suzu] Using model:", model);

    const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            model,
            max_tokens: 1024,
            messages: buildMessages(messages, memories)
        })
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error?.message || "Groq error " + res.status);
    }
    const data = await res.json();
    return { reply: data.choices?.[0]?.message?.content || "", usage: data.usage };
};

const chatStream = async (messages, onChunk, memories = []) => {
    const useVision = hasImages(messages);
    // Vision model doesn't support streaming well — fallback to regular chat
    if (useVision) {
        const result = await chat(messages, memories);
        onChunk(result.reply);
        return result;
    }

    const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            model: TEXT_MODEL,
            max_tokens: 1024,
            stream: true,
            messages: buildMessages(messages, memories)
        })
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error?.message || "Groq stream " + res.status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullReply = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
            const t = line.trim();
            if (!t || t === "data: [DONE]") continue;
            if (t.startsWith("data: ")) {
                try {
                    const chunk = JSON.parse(t.slice(6)).choices?.[0]?.delta?.content || "";
                    if (chunk) { fullReply += chunk; onChunk(chunk); }
                } catch (_) { }
            }
        }
    }
    return { reply: fullReply };
};

const generateTitle = async (firstMessage) => {
    try {
        const res = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                model: "llama3-8b-8192",
                max_tokens: 10,
                messages: [
                    { role: "system", content: "Create a 3-5 word title for this conversation. Only the title, no punctuation." },
                    { role: "user", content: typeof firstMessage === "string" ? firstMessage.slice(0, 200) : "New conversation" }
                ]
            })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || "New Chat";
    } catch (_) {
        return "New Chat";
    }
};

module.exports = { chat, chatStream, generateTitle, buildUserContent };