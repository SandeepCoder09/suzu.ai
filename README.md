# ✦ ARIA — Personal AI Talking Assistant

A full-stack voice + text AI assistant powered by Claude (Anthropic).  
Talk to it by voice or text. It remembers your conversation and replies both in text and speech.

---

## 🗂 Folder Structure

```
aria-ai/
├── package.json                  ← Root: runs both servers together
├── backend/                      ← Node.js + Express API
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js             ← Entry point
│       ├── app.js                ← Express setup
│       ├── config/logger.js
│       ├── controllers/chat.controller.js
│       ├── middleware/errorHandler.js
│       ├── middleware/rateLimiter.js
│       ├── middleware/validate.js
│       ├── routes/chat.routes.js
│       ├── routes/health.routes.js
│       └── services/
│           ├── anthropic.service.js
│           └── session.service.js
└── frontend/                     ← React + Vite
    ├── index.html
    ├── vite.config.js
    ├── .env.example
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── components/
        │   ├── Header.jsx
        │   ├── OrbButton.jsx
        │   ├── ChatWindow.jsx
        │   ├── MessageBubble.jsx
        │   ├── TextInput.jsx
        │   └── SettingsPanel.jsx
        ├── hooks/
        │   ├── useChat.js
        │   └── useSpeech.js
        ├── services/api.js
        └── styles/
            ├── global.css
            ├── App.module.css
            ├── Header.module.css
            ├── OrbButton.module.css
            ├── ChatWindow.module.css
            ├── MessageBubble.module.css
            ├── TextInput.module.css
            └── SettingsPanel.module.css
```

---

## 🚀 Setup & Run

### 1. Get your Anthropic API Key
Go to https://console.anthropic.com and create an API key.

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and set:
```
ANTHROPIC_API_KEY=your_key_here
```

### 3. Install dependencies
```bash
npm run install:all
```

### 4. Start both servers
```bash
npm run dev
```
- Frontend → http://localhost:5173  
- Backend  → http://localhost:5000

---

## 🎙 How to Use

| Action | How |
|---|---|
| **Voice input** | Tap the glowing orb |
| **Text input** | Type in the bar, press Enter |
| **Stop speaking** | Tap orb again or "Stop speaking" |
| **Mute voice replies** | Click 🔊 in the header |
| **Change voice** | Click ⚙ → Settings |
| **New conversation** | Click "New chat" |

> ✅ Voice works best in **Chrome** or **Edge**. Allow microphone when prompted.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/message` | Send a message, get reply |
| POST | `/api/chat/stream` | Streaming reply (SSE) |
| POST | `/api/chat/new` | Create a new session |
| GET | `/api/chat/:id/history` | Get conversation history |
| DELETE | `/api/chat/:id` | Clear a session |
| GET | `/api/health` | Server health check |

---

## 🛠 Tech Stack

**Frontend:** React 18, Vite, CSS Modules, Web Speech API  
**Backend:** Node.js, Express, Anthropic SDK, Winston, UUID  
**AI:** Claude Sonnet (claude-sonnet-4-20250514)
