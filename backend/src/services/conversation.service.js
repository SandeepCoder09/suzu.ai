const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Use built-in crypto — no external uuid package needed
const uuidv4 = () => crypto.randomUUID();

const DATA_DIR = path.join(__dirname, "../../data/conversations");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const INDEX_PATH = path.join(DATA_DIR, "index.json");
const MEMORY_PATH = path.join(DATA_DIR, "memory.json");

const readIndex = () => { try { return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")); } catch { return []; } };
const writeIndex = (i) => fs.writeFileSync(INDEX_PATH, JSON.stringify(i, null, 2));
const convPath = (id) => path.join(DATA_DIR, `${id}.json`);
const readConv = (id) => { try { return JSON.parse(fs.readFileSync(convPath(id), "utf8")); } catch { return null; } };
const writeConv = (c) => fs.writeFileSync(convPath(c.id), JSON.stringify(c, null, 2));

const listAll = () => readIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

const create = (title = "New Conversation") => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const conv = { id, title, messages: [], createdAt: now, updatedAt: now, pinned: false };
    writeConv(conv);
    const index = readIndex();
    index.push({ id, title, createdAt: now, updatedAt: now, pinned: false, preview: "" });
    writeIndex(index);
    return conv;
};

const get = (id) => readConv(id);

const appendMessage = (id, role, content) => {
    let conv = readConv(id);
    if (!conv) { conv = create(); }
    conv.messages.push({ role, content, timestamp: new Date().toISOString() });
    conv.updatedAt = new Date().toISOString();
    if (conv.title === "New Conversation" || conv.title === "नई बातचीत") {
        const first = conv.messages.find(m => m.role === "user");
        if (first) conv.title = first.content.slice(0, 48) + (first.content.length > 48 ? "…" : "");
    }
    writeConv(conv);
    const index = readIndex();
    const idx = index.findIndex(c => c.id === id);
    const meta = { id, title: conv.title, createdAt: conv.createdAt, updatedAt: conv.updatedAt, pinned: conv.pinned, preview: conv.messages.filter(m => m.role === "assistant").slice(-1)[0]?.content?.slice(0, 80) || "" };
    if (idx >= 0) index[idx] = meta; else index.push(meta);
    writeIndex(index);
    return conv;
};

const rename = (id, title) => {
    const conv = readConv(id); if (!conv) return null;
    conv.title = title; conv.updatedAt = new Date().toISOString();
    writeConv(conv);
    const index = readIndex(); const idx = index.findIndex(c => c.id === id);
    if (idx >= 0) { index[idx].title = title; index[idx].updatedAt = conv.updatedAt; }
    writeIndex(index); return conv;
};

const togglePin = (id) => {
    const conv = readConv(id); if (!conv) return null;
    conv.pinned = !conv.pinned; conv.updatedAt = new Date().toISOString();
    writeConv(conv);
    const index = readIndex(); const idx = index.findIndex(c => c.id === id);
    if (idx >= 0) index[idx].pinned = conv.pinned;
    writeIndex(index); return { pinned: conv.pinned };
};

const remove = (id) => {
    try { fs.unlinkSync(convPath(id)); } catch (_) { }
    writeIndex(readIndex().filter(c => c.id !== id)); return true;
};

const search = (query) => {
    const q = query.toLowerCase();
    return listAll().filter(c => c.title.toLowerCase().includes(q) || (c.preview || "").toLowerCase().includes(q));
};

const readMemory = () => { try { return JSON.parse(fs.readFileSync(MEMORY_PATH, "utf8")); } catch { return []; } };
const saveMemory = (items) => fs.writeFileSync(MEMORY_PATH, JSON.stringify(items, null, 2));
const getMemories = () => readMemory();
const addMemory = (text) => { const items = readMemory(); const item = { id: uuidv4(), text, createdAt: new Date().toISOString() }; items.push(item); saveMemory(items); return item; };
const deleteMemory = (id) => { saveMemory(readMemory().filter(m => m.id !== id)); return true; };

module.exports = { listAll, create, get, appendMessage, rename, togglePin, remove, search, getMemories, addMemory, deleteMemory };