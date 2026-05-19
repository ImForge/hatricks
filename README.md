# Hatricks

A personal AI companion that knows you, remembers you, and grows with you. Not a chatbot. A friend.

Inspired by the loyalty and warmth of Hagrid from Harry Potter — Hatricks is always there, never judges, and tells you the truth even when you don't want to hear it.

---

## What Hatricks Does

- Talks to you like a real friend, not an assistant
- Remembers facts about you across conversations
- Notices behavioral patterns over time
- Tracks your growth and struggles
- Runs on your PC and phone

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| AI | Groq API (Llama 3.3 70B) |
| Memory | Three layer system: facts, patterns, growth moments |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A free Groq API key from [console.groq.com](https://console.groq.com)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/imforge/hatricks.git
cd hatricks
```

**2. Install server dependencies**

```bash
cd server
npm install
```

**3. Install client dependencies**

```bash
cd ../client
npm install
```

**4. Set up environment variables**

```bash
cd ../server
cp .env.example .env
```

Open `.env` and add your Groq API key:

```
GROQ_API_KEY=your-groq-api-key-here
PORT=3001
```

**5. Run Hatricks**

On Windows, double click `start.bat` from the root folder.

Or manually in two terminals:

```bash
# Terminal 1 — server
cd server
node index.js

# Terminal 2 — frontend
cd client
npm run dev
```

**6. Open your browser at `http://localhost:5173`**

---

## Accessing on Your Phone

Make sure your phone and PC are on the same WiFi network, then:

**1. Find your PC's local IP**

```bash
ipconfig
```

**2. Update `SERVER_URL` in `client/src/App.jsx`**

```javascript
const SERVER_URL = 'http://YOUR_PC_IP:3001'
```

**3. Update `vite.config.js` to expose the network**

```javascript
server: {
  host: true,
  port: 5173,
  allowedHosts: 'all',
}
```

**4. Open `http://YOUR_PC_IP:5173` on your phone browser and add to home screen**

---

## How Memory Works

Hatricks has three layers of memory:

**Facts** — things that are true about you. Your name, your goals, your situation.

**Patterns** — behavioral patterns noticed over time. How you think, what you avoid, what you keep coming back to.

**Growth moments** — real moments of progress or struggle. Tracked and referenced naturally in conversation.

Every 6 messages, Hatricks runs a deep extraction on the conversation and updates all three layers. The next time you talk, he already knows.

You can inspect his brain anytime at `http://localhost:3001/brain`.

---

## Project Structure

```
hatricks/
├── client/                  # React frontend
│   ├── public/
│   │   ├── hatricks.png     # Hatricks avatar
│   │   └── me.png           # Your avatar
│   └── src/
│       └── App.jsx          # Main chat UI
│
├── server/                  # Node.js backend
│   ├── index.js             # Server + API routes
│   ├── database.js          # SQLite memory system
│   ├── .env                 # Your secrets (never pushed)
│   └── .env.example         # Template for others
│
└── start.bat                # One click startup for Windows
```

---

## Customizing Hatricks

**Change his personality** — edit the `HATRICKS_PERSONALITY` constant in `server/index.js`.

**Change his avatar** — replace `client/public/hatricks.png` with any image.

**Change your avatar** — replace `client/public/me.png` with your photo.

---

## Debug Endpoints

| Endpoint | What it shows |
|---|---|
| `GET /health` | Server status |
| `GET /brain` | Everything Hatricks knows — facts, patterns, growth moments |
| `GET /conversation/:id` | Full message history for a conversation |

---

## Notes

- Conversation history and memories are stored locally in `server/hatricks.db`
- The database file is gitignored — your personal data never leaves your machine
- Groq free tier allows 1500 requests per day which is plenty for personal use
- ngrok URLs change every session — update `SERVER_URL` in `App.jsx` each time you restart

---

## Built By

Shivam Tiwari — a student who wanted a friend that actually exists.
