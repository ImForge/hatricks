const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'hatricks.db'));

db.pragma('journal_mode = WAL');

// ── TABLES ──

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  )
`);

// Facts — things that are true about the user
// e.g. "User is a CS student"
db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Patterns — behavioral patterns Hatricks notices
// e.g. "User gets excited about new ideas but often abandons them"
db.exec(`
  CREATE TABLE IF NOT EXISTS patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    occurrences INTEGER DEFAULT 1,  -- how many times this pattern has shown up
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Growth moments — times the user showed real growth or hit a real low
// e.g. "User finally shipped their first project after weeks of procrastinating"
db.exec(`
  CREATE TABLE IF NOT EXISTS growth_moments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'growth' or 'struggle'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── FUNCTIONS ──

function createConversation(id) {
  db.prepare(`INSERT INTO conversations (id) VALUES (?)`).run(id);
  return id;
}

function saveMessage(conversationId, role, content) {
  db.prepare(`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (?, ?, ?)
  `).run(conversationId, role, content);
}

function getMessages(conversationId) {
  return db.prepare(`
    SELECT role, content FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).all(conversationId);
}

function touchConversation(id) {
  db.prepare(`
    UPDATE conversations SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
}

// ── MEMORY FUNCTIONS ──

function saveMemory(content) {
  const existing = db.prepare(`
    SELECT id FROM memories WHERE content = ?
  `).get(content);

  if (!existing) {
    db.prepare(`INSERT INTO memories (content) VALUES (?)`).run(content);
  }
}

function getAllMemories() {
  return db.prepare(`
    SELECT content FROM memories ORDER BY created_at ASC
  `).all().map(r => r.content);
}

// ── PATTERN FUNCTIONS ──

function savePattern(content) {
  // If pattern already exists, increment its occurrence count
  // This tells us how strong/repeated the pattern is
  const existing = db.prepare(`
    SELECT id FROM patterns WHERE content = ?
  `).get(content);

  if (existing) {
    db.prepare(`
      UPDATE patterns 
      SET occurrences = occurrences + 1, last_seen = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(existing.id);
  } else {
    db.prepare(`
      INSERT INTO patterns (content) VALUES (?)
    `).run(content);
  }
}

function getAllPatterns() {
  // Return strongest patterns first (most occurrences)
  return db.prepare(`
    SELECT content, occurrences FROM patterns
    ORDER BY occurrences DESC, last_seen DESC
  `).all();
}

// ── GROWTH MOMENT FUNCTIONS ──

function saveGrowthMoment(content, type) {
  // Don't save duplicates
  const existing = db.prepare(`
    SELECT id FROM growth_moments WHERE content = ?
  `).get(content);

  if (!existing) {
    db.prepare(`
      INSERT INTO growth_moments (content, type) VALUES (?, ?)
    `).run(content, type);
  }
}

function getAllGrowthMoments() {
  return db.prepare(`
    SELECT content, type FROM growth_moments
    ORDER BY created_at DESC
    LIMIT 20
  `).all();
}

// ── FULL CONTEXT ──
// This is the big one — builds everything Hatricks knows about you
// into one structured string that gets injected into every conversation
function buildFullContext() {
  const memories = getAllMemories();
  const patterns = getAllPatterns();
  const growthMoments = getAllGrowthMoments();

  let context = '';

  if (memories.length > 0) {
    context += '\n\n--- WHAT YOU KNOW ABOUT THIS PERSON ---\n';
    context += memories.map(m => `• ${m}`).join('\n');
  }

  if (patterns.length > 0) {
    context += '\n\n--- PATTERNS YOU\'VE NOTICED IN THEM ---\n';
    context += patterns.map(p =>
      `• ${p.content}${p.occurrences > 1 ? ` (seen ${p.occurrences} times)` : ''}`
    ).join('\n');
  }

  if (growthMoments.length > 0) {
    context += '\n\n--- THEIR JOURNEY SO FAR ---\n';
    const growth = growthMoments.filter(g => g.type === 'growth');
    const struggles = growthMoments.filter(g => g.type === 'struggle');

    if (growth.length > 0) {
      context += 'Growth moments:\n';
      context += growth.map(g => `• ${g.content}`).join('\n');
    }
    if (struggles.length > 0) {
      context += '\nStruggles:\n';
      context += struggles.map(g => `• ${g.content}`).join('\n');
    }
  }

  return context;
}

module.exports = {
  createConversation,
  saveMessage,
  getMessages,
  touchConversation,
  saveMemory,
  getAllMemories,
  savePattern,
  getAllPatterns,
  saveGrowthMoment,
  getAllGrowthMoments,
  buildFullContext,
};