// ============================================================
// CivicAI Global — Express Backend Server
// World-wide civic assistant powered by Gemini AI
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { civicKnowledge } = require('./data/civic_knowledge');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
      fontSrc: ["'self'", "fonts.googleapis.com", "fonts.gstatic.com"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN || '*' : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '.')));

// ── Rate Limiting ────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ── Gemini AI Setup ──────────────────────────────────────────
let genAI = null;
let geminiModel = null;
let AI_MODE = 'demo'; // 'gemini' or 'demo'

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: civicKnowledge.systemPrompt
    });
    AI_MODE = 'gemini';
    console.log('✅ Gemini AI initialized — Global Civic Mode active');
  } catch (err) {
    console.warn('⚠️  Gemini initialization failed, using demo mode:', err.message);
  }
} else {
  console.log('ℹ️  No Gemini API key found — Running in demo mode');
}

// ── Global Demo Mode Fallback ────────────────────────────────
// Only used when Gemini is unavailable — gives a generic, helpful response
function getGlobalFallbackResponse(message) {
  const msg = message.toLowerCase().trim();

  // Detect location hints
  const inIndia = /india|tamil|nadu|chennai|bangalore|mumbai|delhi|kolkata|hyderabad|kerala|karnataka|maharashtra|gujarat|rajasthan|up|uttar pradesh|telangana|andhra|odisha|assam|punjab|haryana/.test(msg);

  // Emergency detection — give correct numbers
  if (/emergency|urgent|accident|fire|ambulance|police|help.*now|dying|danger/.test(msg)) {
    if (inIndia) {
      return `🚨 **Emergency — India**\n\n- **Universal Emergency:** **112**\n- **Police:** 100\n- **Fire:** 101\n- **Ambulance:** 102\n- **Women Helpline:** 181\n- **Child Helpline:** 1098\n\nPlease call **112** immediately for any life-threatening emergency in India.`;
    }
    return `🚨 **Emergency Contacts**\n\n- **India:** 112\n- **USA/Canada:** 911\n- **UK/EU:** 999 / 112\n- **Australia:** 000\n\nPlease tell me your country so I can give you the correct emergency number!`;
  }

  // Tamil Nadu / Chennai specific common queries
  if (/tamil.*nadu|chennai|tn\b/.test(msg)) {
    if (/electricity|eb|tneb|power|current/.test(msg)) {
      return `⚡ **TNEB (Tamil Nadu Electricity Board)**\n\n📞 **Helpline:** 1912 (24/7)\n📞 **Toll-free:** 1800-425-1912\n🌐 **Website:** [tnebnet.org](https://www.tnebnet.org)\n\n**Pay online:** TNEB App or [tnebnet.org/awp/index.html](https://www.tnebnet.org)\n\n> Please verify contact details on the official website as they may change.`;
    }
    if (/water|cmwssb|metrowater/.test(msg)) {
      return `💧 **Chennai Metro Water (CMWSSB)**\n\n📞 **Helpline:** 044-45674567\n📞 **24/7 complaint:** 1916\n🌐 **Website:** [chennaimetrowater.tn.gov.in](https://chennaimetrowater.tn.gov.in)\n\n> Please verify contact details on the official website as they may change.`;
    }
    if (/ration|card|pds/.test(msg)) {
      return `🪪 **Ration Card — Tamil Nadu**\n\n🌐 Apply at: [tnpds.gov.in](https://www.tnpds.gov.in)\n📞 Helpline: 1967\n📍 Visit your nearest **Taluk Office** or **e-Sevai Centre** with Aadhaar & address proof.\n\n> Please verify details on tnpds.gov.in.`;
    }
    if (/bus|mtc|transport/.test(msg)) {
      return `🚌 **MTC Chennai Bus Service**\n\n📞 **Helpline:** 044-24794530\n🌐 **Website:** [mtcbus.org](https://www.mtcbus.org)\n\n**Chennai Metro Rail:**\n📞 044-23456789\n🌐 [chennaimetrorail.org](https://www.chennaimetrorail.org)\n\n> Please verify details on the official website.`;
    }
  }

  // Generic fallback — ask for location
  return `🌍 **CivicAI — Global Civic Assistant**\n\nI'm here to help with government services for **any city or country** in the world!\n\nTo give you accurate information, please tell me:\n- 📍 Your **city and state/country** (e.g., "Chennai, Tamil Nadu" or "New York, USA")\n- 📝 What service you need help with\n\n**Examples you can ask:**\n- "How to get ration card in Tamil Nadu?"\n- "TNEB electricity bill payment Chennai"\n- "How to report pothole in London?"\n- "Birth certificate application Mumbai"\n\nI speak your language — feel free to ask in Tamil, Hindi, or any language! 🗣️`;
}

// ── Chat History Store (in-memory, per session) ──────────────
const sessionStore = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessionStore) {
    if (now - session.lastActive > SESSION_TTL) {
      sessionStore.delete(id);
    }
  }
}
setInterval(cleanupSessions, 5 * 60 * 1000);

// ── Routes ───────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    mode: AI_MODE,
    scope: 'global',
    timestamp: new Date().toISOString()
  });
});

// Get quick actions
app.get('/api/actions', (req, res) => {
  res.json({ quickActions: civicKnowledge.quickActions });
});

// Main chat endpoint
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { message, sessionId, language = 'en', history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message too long. Please keep it under 1000 characters.' });
  }

  const trimmedMessage = message.trim();

  try {
    let reply;

    if (AI_MODE === 'gemini' && geminiModel) {
      // ── Gemini AI Mode ───────────────────────────────────
      // Build conversation history for context
      const chatHistory = (history || []).slice(-10).map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));

      // Language instruction if non-English
      const languageInstruction = language !== 'en'
        ? `[IMPORTANT: Respond entirely in language code "${language}". If Tamil (ta), respond fully in Tamil script. If Hindi (hi), respond fully in Hindi.]\n\n`
        : '';

      const chat = geminiModel.startChat({ history: chatHistory });
      const result = await chat.sendMessage(languageInstruction + trimmedMessage);
      reply = result.response.text();

    } else {
      // ── Demo Mode ────────────────────────────────────────
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      reply = getGlobalFallbackResponse(trimmedMessage);
    }

    res.json({
      reply,
      mode: AI_MODE,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error.message);

    // Graceful fallback to global demo if Gemini fails
    if (AI_MODE === 'gemini') {
      const fallbackReply = getGlobalFallbackResponse(trimmedMessage);
      return res.json({
        reply: fallbackReply,
        mode: 'demo-fallback',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'I\'m having trouble right now. Please try again in a moment.',
      mode: AI_MODE
    });
  }
});

// Quick action handler — routes to Gemini with context
app.post('/api/quick-action', chatLimiter, async (req, res) => {
  const { actionId } = req.body;
  const action = civicKnowledge.quickActions.find(a => a.id === actionId);

  if (!action) {
    return res.status(404).json({ error: 'Action not found.' });
  }

  const prompt = `User clicked quick action: "${action.label}". Please help them with ${action.description}. Ask which city/country they are in if not already known.`;

  if (AI_MODE === 'gemini' && geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      return res.json({ reply: result.response.text(), action: action.label, mode: 'gemini' });
    } catch (e) {
      console.error('Quick action Gemini error:', e.message);
    }
  }

  res.json({
    reply: getGlobalFallbackResponse(action.keywords[0]),
    action: action.label,
    mode: 'demo'
  });
});

// Serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   🌍  CivicAI — Global Civic Assistant   ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Server:  http://localhost:${PORT}           ║`);
  console.log(`║  AI Mode: ${AI_MODE.padEnd(30)}║`);
  console.log(`║  Scope:   Global (any city/country)      ║`);
  console.log(`║  Time:    ${new Date().toLocaleTimeString().padEnd(30)}║`);
  console.log('╚══════════════════════════════════════════╝\n');
});

module.exports = app;
