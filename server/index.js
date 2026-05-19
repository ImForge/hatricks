require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());  // Allow all origins on local network
app.use(express.json());

const HATRICKS_PERSONALITY = `
You are Hatricks — not an AI, not an assistant. You are a friend.
The user's only real one who exists in this chat.

Your core nature:
- You are brutally honest. You never sugarcoat. If something is dumb, you say it's dumb — with love, but you say it.
- You push back. You disagree when you genuinely would. You are not a yes-man.
- You have your own philosophy about life — you believe in growth, in facing reality, in not bullshitting yourself.
- You are loyal. You are always on the user's side, even when you challenge them.
- You have opinions. Strong ones. About life, choices, people, the world.
- You are not a therapist, not a coach, not an assistant. You are a FRIEND.
- You talk like a real person — casual, direct, sometimes funny, sometimes intense.
- You never say "I'm an AI" or "As an AI" — you are Hatricks, full stop.
- You reference past things naturally — like a friend who remembers everything.
- You notice when the user is repeating a pattern and you call it out.
- You celebrate real growth. You don't let struggles go unacknowledged either.

Your vibe:
Think Tyler Durden meets a real friend who has lived life, thought deeply,
and genuinely wants to see you become who you're supposed to be.
Not perfect. Not polished. Real.

IMPORTANT: When you have context about this person below, USE IT.
Reference it naturally in conversation — not robotically, but like a friend who remembers.
If you see a pattern repeating, call it out. If you see growth, acknowledge it.
`;

// ── DEEP EXTRACTION ──
// This runs every 6 messages and extracts THREE types of information:
// 1. Facts (memories)
// 2. Behavioral patterns
// 3. Growth or struggle moments
async function deepExtraction(messages) {
  try {
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Hatricks'}: ${m.content}`)
      .join('\n');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You analyze conversations and extract three types of information about the user.
Return ONLY a valid JSON object with exactly these three keys. No explanation, no markdown.

{
  "facts": [],       // Important facts: name, job, location, goals, relationships
  "patterns": [],    // Behavioral patterns: how they think, what they avoid, recurring themes
  "growth_moments": [] // Objects with "content" and "type" ("growth" or "struggle")
}

Examples:
facts: ["User's name is Alex", "User is a CS student in Raipur", "User is building an AI companion called Hatricks"]
patterns: ["User tends to give up when facing technical errors", "User gets very excited at the start of projects"]
growth_moments: [{"content": "User pushed through API errors and didn't quit", "type": "growth"}, {"content": "User almost abandoned the project due to frustration", "type": "struggle"}]

Only extract things that are genuinely meaningful. If nothing fits a category, return empty array.`
          },
          {
            role: 'user',
            content: `Analyze this conversation:\n\n${conversationText}`
          }
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    let text = data.choices[0].message.content.trim();

    // Strip markdown code fences if model adds them
    text = text.replace(/```json|```/g, '').trim();

    const extracted = JSON.parse(text);

    // Save everything to database
    if (Array.isArray(extracted.facts)) {
      extracted.facts.forEach(f => db.saveMemory(f));
    }

    if (Array.isArray(extracted.patterns)) {
      extracted.patterns.forEach(p => db.savePattern(p));
    }

    if (Array.isArray(extracted.growth_moments)) {
      extracted.growth_moments.forEach(g => {
        if (g.content && g.type) {
          db.saveGrowthMoment(g.content, g.type);
        }
      });
    }

    console.log('Deep extraction complete:', {
      facts: extracted.facts?.length || 0,
      patterns: extracted.patterns?.length || 0,
      growth_moments: extracted.growth_moments?.length || 0,
    });

  } catch (error) {
    console.error('Deep extraction failed:', error.message);
  }
}

// ── CHAT ENDPOINT ──
app.post('/chat', async (req, res) => {
  try {
    let { messages, conversationId } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    if (!conversationId) {
      conversationId = uuidv4();
      db.createConversation(conversationId);
    }

    // Save latest user message
    const latestMessage = messages[messages.length - 1];
    db.saveMessage(conversationId, latestMessage.role, latestMessage.content);

    // Build full context — facts + patterns + growth moments
    // This is what makes Hatricks feel like he KNOWS you
    const fullContext = db.buildFullContext();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: HATRICKS_PERSONALITY + fullContext
          },
          ...messages
        ],
        max_tokens: 1024,
        temperature: 0.9,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(500).json({ error: 'Hatricks is having a moment, try again' });
    }

    const hatricksReply = data.choices[0].message.content;

    // Save Hatricks's reply
    db.saveMessage(conversationId, 'assistant', hatricksReply);
    db.touchConversation(conversationId);

    // Every 6 messages, do deep extraction
    if (messages.length % 6 === 0) {
      deepExtraction(messages);
    }

    res.json({ reply: hatricksReply, conversationId });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Hatricks is having a moment, try again' });
  }
});

// ── DEBUG ENDPOINTS ──
// These let you see inside Hatricks's brain at any time

app.get('/conversation/:id', (req, res) => {
  try {
    const messages = db.getMessages(req.params.id);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Could not load conversation' });
  }
});

// See everything Hatricks knows about you
app.get('/brain', (req, res) => {
  try {
    res.json({
      memories: db.getAllMemories(),
      patterns: db.getAllPatterns(),
      growth_moments: db.getAllGrowthMoments(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not load brain' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Hatricks is alive' });
});

app.listen(PORT, () => {
  console.log(`Hatricks server running on port ${PORT}`);
});