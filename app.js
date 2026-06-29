/* ================================================================
   CivicAI — Frontend Application Logic
   Handles: Chat, Language, Quick Actions, Animations, API calls
   ================================================================ */

'use strict';

// ── State ──────────────────────────────────────────────────────
const state = {
  currentLang: 'en',
  currentLangName: 'English',
  conversationHistory: [],
  isLoading: false,
  questionCount: 0,
  sessionId: generateSessionId(),
  aiMode: 'demo'
};

// ── DOM References ─────────────────────────────────────────────
const DOM = {
  messagesWindow:   () => document.getElementById('messagesWindow'),
  chatInput:        () => document.getElementById('chatInput'),
  sendBtn:          () => document.getElementById('sendBtn'),
  charCounter:      () => document.getElementById('charCounter'),
  langBtn:          () => document.getElementById('langBtn'),
  langCurrent:      () => document.getElementById('langCurrent'),
  langDropdown:     () => document.getElementById('langDropdown'),
  langSelector:     () => document.getElementById('langSelector'),
  langSearch:       () => document.getElementById('langSearch'),
  langList:         () => document.getElementById('langList'),
  langOptions:      () => document.querySelectorAll('.lang-option'),
  suggestionsBar:   () => document.getElementById('suggestionsBar'),
  suggestionChips:  () => document.querySelectorAll('.suggestion-chip'),
  clearChatBtn:     () => document.getElementById('clearChatBtn'),
  quickActionsGrid: () => document.getElementById('quickActionsGrid'),
  questionCount:    () => document.getElementById('questionCount'),
  aiBadge:          () => document.getElementById('aiBadge'),
  botStatusText:    () => document.getElementById('botStatusText'),
  statusBadge:      () => document.getElementById('statusBadge'),
  toast:            () => document.getElementById('toast'),
  mobileMenuBtn:    () => document.getElementById('mobileMenuBtn'),
  sidebar:          () => document.querySelector('.sidebar'),
  mobileOverlay:    () => document.getElementById('mobileOverlay'),
};

// ── Language Metadata ──────────────────────────────────────────
const LANG_GREETINGS = {
  en: { greeting: "Hello! I'm CivicAI, your global government services assistant.", hint: "Ask me about civic services for any city, state, or country in the world!" },
  es: { greeting: "¡Hola! Soy CivicAI, tu asistente global de servicios gubernamentales.", hint: "¡Pregunta sobre servicios civiles de cualquier ciudad, estado o país del mundo!" },
  fr: { greeting: "Bonjour ! Je suis CivicAI, votre assistant mondial de services gouvernementaux.", hint: "Posez-moi des questions sur les services civiques pour n'importe quelle ville ou pays !" },
  zh: { greeting: "你好！我是 CivicAI，您的全球政务服务助手。", hint: "请询问世界任何城市或国家的政务服务！" },
  hi: { greeting: "नमस्ते! मैं CivicAI हूँ, आपका वैश्विक नागरिक सेवा सहायक।", hint: "दुनिया के किसी भी शहर या देश की सरकारी सेवाओं के बारे में पूछें!" },
  ar: { greeting: "مرحباً! أنا CivicAI، مساعدك العالمي للخدمات الحكومية.", hint: "اسألني عن الخدمات المدنية في أي مدينة أو بلد في العالم!" },
  pt: { greeting: "Olá! Sou CivicAI, seu assistente global de serviços governamentais.", hint: "Pergunte sobre serviços cívicos de qualquer cidade ou país do mundo!" },
  de: { greeting: "Hallo! Ich bin CivicAI, Ihr globaler Assistent für Behördienste.", hint: "Fragen Sie mich nach Behördendiensten in jeder Stadt oder jedem Land der Welt!" },
  ja: { greeting: "こんにちは！CivicAI です。世界中の行政サービスをサポートします。", hint: "世界中のどの都市や国についても質問してください！" },
  ko: { greeting: "안녕하세요! 저는 전 세계 행정 서비스 AI 도우미 CivicAI입니다.", hint: "세계 어느 도시나 나라의 시민 서비스에 대해 질문해 주세요!" },
  ta: { greeting: "வணக்கம்! நான் CivicAI, உலகின் எந்த நகரம் அல்லது நாட்டிற்குமான உதவியாளர்.", hint: "தமிழ்நாடு, இந்தியா, அல்லது உலகின் எங்கணுமான அரசு சேவைகளைப் பற்றி கேளுங்கள்!" },
  ru: { greeting: "Привет! Я CivicAI, ваш глобальный помощник по государственным услугам.", hint: "Спрашивайте о госуслугах в любом городе или стране мира!" },
};

const RTL_LANGS = ['ar', 'he', 'fa', 'ur'];

// ── Quick Actions Data ─────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'water-bill',  emoji: '💧', label: 'Utility Bill',       desc: 'Water/electricity',   prompt: 'How do I pay my electricity or water bill?' },
  { id: 'certificate', emoji: '📄', label: 'Get Certificate',    desc: 'Birth, death, marriage', prompt: 'How to get a birth certificate?' },
  { id: 'ration-card', emoji: '🪪', label: 'Ration / ID Card',  desc: 'Ration, Aadhaar, PAN', prompt: 'How to apply for a ration card?' },
  { id: 'complaint',   emoji: '🚧', label: 'File Complaint',     desc: 'Roads, lights, waste', prompt: 'How do I file a complaint about road repair?' },
  { id: 'permit',      emoji: '📋', label: 'Get a Permit',       desc: 'Build, biz, events',  prompt: 'How do I get a building permit?' },
  { id: 'transport',   emoji: '🚌', label: 'Public Transport',   desc: 'Bus, metro, train',   prompt: 'How do I find public transport routes?' },
  { id: 'health',      emoji: '🏥', label: 'Health Services',    desc: 'Hospital, vaccine',   prompt: 'Where is the nearest government hospital?' },
  { id: 'emergency',   emoji: '🚨', label: 'Emergency Numbers',  desc: 'Police, fire, 112',   prompt: 'What are the emergency contact numbers in India?' },
];

// ================================================================
// UTILITIES
// ================================================================

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Convert markdown-like syntax in bot responses to HTML
 */
function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Phone links
  html = html.replace(/\((\d{3})\)\s*(\d{3}-\d{4})/g,
    '<a href="tel:+1$1$2">($1) $2</a>');
  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');
  // Bullet list
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/gs, '<ul>$1</ul>');
  // Numbered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  return `<p>${html}</p>`;
}

function showToast(message, duration = 3000) {
  const toast = DOM.toast();
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function scrollToBottom(smooth = true) {
  const win = DOM.messagesWindow();
  if (!win) return;
  win.scrollTo({ top: win.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

// ================================================================
// CHAT FUNCTIONS
// ================================================================

function createMessageElement(role, content, timestamp = new Date()) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  msg.setAttribute('role', 'listitem');

  const isUser = role === 'user';
  const avatarContent = isUser
    ? (state.currentLang.toUpperCase().slice(0, 1) || 'U')
    : '🏛️';

  const bubbleHtml = isUser
    ? `<p>${escapeHtml(content)}</p>`
    : renderMarkdown(content);

  msg.innerHTML = `
    <div class="message-avatar" aria-hidden="true">${avatarContent}</div>
    <div class="message-content">
      <div class="message-bubble">${bubbleHtml}</div>
      <div class="message-meta">
        <span>${isUser ? 'You' : 'CivicAI'}</span>
        <span>·</span>
        <time datetime="${timestamp.toISOString()}">${formatTime(timestamp)}</time>
      </div>
    </div>
  `;
  return msg;
}

function showTypingIndicator() {
  removeTypingIndicator();
  const win = DOM.messagesWindow();
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.id = 'typingIndicator';
  indicator.innerHTML = `
    <div class="message-avatar" aria-hidden="true">🏛️</div>
    <div class="typing-bubble" aria-label="CivicAI is typing">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  win.appendChild(indicator);
  scrollToBottom();
}

function removeTypingIndicator() {
  const existing = document.getElementById('typingIndicator');
  if (existing) existing.remove();
}

function showWelcomeMessage() {
  const win = DOM.messagesWindow();
  win.innerHTML = '';

  const lang = state.currentLang;
  const greet = LANG_GREETINGS[lang] || LANG_GREETINGS.en;

  const welcome = document.createElement('div');
  welcome.className = 'welcome-message';
  welcome.id = 'welcomeMessage';
  welcome.innerHTML = `
    <div class="welcome-icon" aria-hidden="true">🏛️</div>
    <h2 class="welcome-title">Welcome to CivicAI</h2>
    <p class="welcome-subtitle">${escapeHtml(greet.greeting)}<br><span style="color:var(--text-muted);font-size:0.82em">${escapeHtml(greet.hint)}</span></p>
    <div class="welcome-features">
      <div class="welcome-feature">
        <span>🌍</span>
        <span>12 Languages</span>
      </div>
      <div class="welcome-feature">
        <span>⚡</span>
        <span>Instant Help</span>
      </div>
      <div class="welcome-feature">
        <span>🕐</span>
        <span>24/7 Online</span>
      </div>
    </div>
  `;
  win.appendChild(welcome);

  // Show suggestions bar
  DOM.suggestionsBar().style.display = '';
}

function removeWelcomeMessage() {
  const welcome = document.getElementById('welcomeMessage');
  if (welcome) {
    welcome.style.animation = 'none';
    welcome.style.opacity = '0';
    welcome.style.transform = 'scale(0.95)';
    welcome.style.transition = 'all 0.25s ease';
    setTimeout(() => welcome.remove(), 250);
  }
  // Hide suggestions bar once chat starts
  setTimeout(() => {
    DOM.suggestionsBar().style.display = 'none';
  }, 300);
}

async function sendMessage(text) {
  if (!text || !text.trim() || state.isLoading) return;

  const message = text.trim();
  const win = DOM.messagesWindow();

  // Remove welcome screen
  removeWelcomeMessage();

  // Add user message
  const userMsg = createMessageElement('user', message);
  win.appendChild(userMsg);
  scrollToBottom();

  // Update history
  state.conversationHistory.push({ role: 'user', text: message });

  // Update input
  const input = DOM.chatInput();
  input.value = '';
  input.style.height = 'auto';
  updateCharCounter('');

  // Loading state
  state.isLoading = true;
  DOM.sendBtn().disabled = true;
  DOM.chatInput().disabled = true;
  showTypingIndicator();
  updateBotStatus('typing');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: state.sessionId,
        language: state.currentLang,
        history: state.conversationHistory.slice(-8)
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply || "I'm sorry, I couldn't process that. Please try again or check official government portals.";

    // Update AI mode badge
    if (data.mode) {
      state.aiMode = data.mode;
      updateAiBadge(data.mode);
    }

    // Add bot reply
    removeTypingIndicator();
    const botMsg = createMessageElement('bot', reply);
    win.appendChild(botMsg);
    scrollToBottom();

    // Update history
    state.conversationHistory.push({ role: 'model', text: reply });

    // Keep history at max 20 turns
    if (state.conversationHistory.length > 20) {
      state.conversationHistory = state.conversationHistory.slice(-20);
    }

    // Increment question count
    state.questionCount++;
    const qcEl = DOM.questionCount();
    if (qcEl) qcEl.textContent = state.questionCount;

  } catch (error) {
    console.error('Chat error:', error);
    removeTypingIndicator();

    let errMsg = "I'm having trouble connecting to the government service database. Please try again in a moment.";
    if (error.message.includes('Too many')) {
      errMsg = "You've sent a lot of messages! Please wait a moment before trying again.";
    }

    const errEl = createMessageElement('bot', errMsg);
    win.appendChild(errEl);
    scrollToBottom();

    showToast('⚠️ Connection issue — please try again');
  } finally {
    state.isLoading = false;
    DOM.sendBtn().disabled = false;
    DOM.chatInput().disabled = false;
    DOM.chatInput().focus();
    updateBotStatus('ready');
  }
}

function updateBotStatus(status) {
  const statusEl = DOM.botStatusText();
  if (!statusEl) return;
  const statuses = {
    ready:  'Active — Ready to help',
    typing: 'Typing a response...',
    error:  'Having trouble — try again'
  };
  statusEl.textContent = statuses[status] || statuses.ready;
}

function updateAiBadge(mode) {
  const badge = DOM.aiBadge();
  if (!badge) return;
  if (mode === 'gemini') {
    badge.textContent = '✨ Gemini AI';
    badge.style.background = 'rgba(99,102,241,0.15)';
    badge.style.borderColor = 'rgba(99,102,241,0.35)';
    badge.style.color = 'var(--indigo-light)';
  } else {
    badge.textContent = '🤖 Demo Mode';
    badge.style.background = 'rgba(6,182,212,0.1)';
    badge.style.borderColor = 'rgba(6,182,212,0.25)';
    badge.style.color = 'var(--cyan-light)';
  }
}

// ================================================================
// LANGUAGE SYSTEM
// ================================================================

function setLanguage(langCode, langName) {
  state.currentLang = langCode;
  state.currentLangName = langName;

  // Update UI
  DOM.langCurrent().textContent = langCode.toUpperCase();

  // Update all lang-option active states
  DOM.langOptions().forEach(opt => {
    const isActive = opt.dataset.lang === langCode;
    opt.classList.toggle('active', isActive);
    opt.setAttribute('aria-selected', isActive.toString());
  });

  // Handle RTL
  const isRTL = RTL_LANGS.includes(langCode);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = langCode;

  // Update placeholder
  const placeholders = {
    en: 'Ask about government services...',
    es: 'Pregunta sobre servicios gubernamentales...',
    fr: 'Posez des questions sur les services gouvernementaux...',
    zh: '询问政务服务...',
    hi: 'सरकारी सेवाओं के बारे में पूछें...',
    ar: 'اسأل عن الخدمات الحكومية...',
    pt: 'Pergunte sobre os serviços governamentais...',
    de: 'Fragen Sie nach Behördendiensten...',
    ja: '行政サービスについて質問する...',
    ko: '행정 서비스에 대해 질문하세요...',
    ta: 'அரசு சேவைகளைப் பற்றி கேளுங்கள்...',
    ru: 'Спросите о государственных услугах...',
  };
  DOM.chatInput().placeholder = placeholders[langCode] || placeholders.en;

  // Close dropdown
  closeLangDropdown();

  showToast(`🌍 Language set to ${langName}`);

  // If no conversation yet, refresh welcome message
  if (state.conversationHistory.length === 0) {
    showWelcomeMessage();
  }
}

function openLangDropdown() {
  const selector = DOM.langSelector();
  const btn = DOM.langBtn();
  selector.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  DOM.langSearch().focus();
}

function closeLangDropdown() {
  const selector = DOM.langSelector();
  const btn = DOM.langBtn();
  selector.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}

function toggleLangDropdown() {
  DOM.langSelector().classList.contains('open') ? closeLangDropdown() : openLangDropdown();
}

// Language search filter
function filterLanguages(query) {
  const q = query.toLowerCase();
  DOM.langOptions().forEach(opt => {
    const name = opt.dataset.name.toLowerCase();
    const native = (opt.querySelector('.lang-native')?.textContent || '').toLowerCase();
    const visible = !q || name.includes(q) || native.includes(q);
    opt.style.display = visible ? '' : 'none';
  });
}

// ================================================================
// QUICK ACTIONS BUILDER
// ================================================================

function buildQuickActions() {
  const grid = DOM.quickActionsGrid();
  if (!grid) return;

  grid.innerHTML = '';
  QUICK_ACTIONS.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'qa-btn';
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `Ask about: ${action.label}`);
    btn.dataset.prompt = action.prompt;
    btn.innerHTML = `
      <span class="qa-emoji" aria-hidden="true">${action.emoji}</span>
      <span class="qa-label">${action.label}</span>
      <span class="qa-desc">${action.desc}</span>
    `;
    btn.addEventListener('click', () => {
      closeMobileMenu();
      DOM.chatInput().value = action.prompt;
      DOM.chatInput().focus();
      sendMessage(action.prompt);
    });
    grid.appendChild(btn);
  });
}

// ================================================================
// MOBILE MENU
// ================================================================

function openMobileMenu() {
  DOM.sidebar().classList.add('mobile-open');
  DOM.mobileOverlay().classList.add('show');
  DOM.mobileMenuBtn().setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  DOM.sidebar().classList.remove('mobile-open');
  DOM.mobileOverlay().classList.remove('show');
  DOM.mobileMenuBtn().setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// ================================================================
// INPUT HANDLING
// ================================================================

function updateCharCounter(value) {
  const counter = DOM.charCounter();
  if (!counter) return;
  const len = value.length;
  counter.textContent = `${len}/1000`;
  counter.className = 'char-counter';
  if (len > 800) counter.classList.add('warning');
  if (len > 950) counter.classList.add('error');
}

// ================================================================
// CLEAR CHAT
// ================================================================

function clearChat() {
  state.conversationHistory = [];
  state.isLoading = false;
  DOM.sendBtn().disabled = false;
  DOM.chatInput().disabled = false;
  removeTypingIndicator();
  showWelcomeMessage();
  DOM.suggestionsBar().style.display = '';
  updateBotStatus('ready');
  showToast('✅ Conversation cleared');
}

// ================================================================
// API HEALTH CHECK
// ================================================================

async function checkApiHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.mode === 'gemini') {
      updateAiBadge('gemini');
      showToast('✨ Connected to Gemini AI');
    } else {
      updateAiBadge('demo');
    }
  } catch (e) {
    // Server not running — that's fine for local dev
    console.log('ℹ️ API server not detected. Running in offline mode.');
    updateAiBadge('offline');
  }
}

// ================================================================
// EVENT WIRING
// ================================================================

function attachEventListeners() {
  const input = DOM.chatInput();
  const sendBtn = DOM.sendBtn();

  // Send on Enter, shift+Enter = new line
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  // Auto-resize textarea + char counter
  input?.addEventListener('input', () => {
    autoResizeTextarea(input);
    updateCharCounter(input.value);
  });

  // Send button
  sendBtn?.addEventListener('click', () => {
    sendMessage(DOM.chatInput().value);
  });

  // Clear chat
  DOM.clearChatBtn()?.addEventListener('click', () => {
    if (state.conversationHistory.length === 0) {
      showToast('ℹ️ Chat is already empty');
      return;
    }
    if (confirm('Clear the conversation? This cannot be undone.')) {
      clearChat();
    }
  });

  // Language dropdown toggle
  DOM.langBtn()?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLangDropdown();
  });

  // Language option select
  DOM.langOptions().forEach(opt => {
    opt.addEventListener('click', () => {
      setLanguage(opt.dataset.lang, opt.dataset.name);
    });
  });

  // Language search
  DOM.langSearch()?.addEventListener('input', (e) => {
    filterLanguages(e.target.value);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!DOM.langSelector()?.contains(e.target)) {
      closeLangDropdown();
    }
  });

  // Suggestion chips
  DOM.suggestionChips().forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (prompt) sendMessage(prompt);
    });
  });

  // Mobile menu
  DOM.mobileMenuBtn()?.addEventListener('click', () => {
    const isOpen = DOM.sidebar().classList.contains('mobile-open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  DOM.mobileOverlay()?.addEventListener('click', closeMobileMenu);

  // Keyboard: Escape closes dropdowns/menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLangDropdown();
      closeMobileMenu();
    }
  });
}

// ================================================================
// INIT ANIMATIONS
// ================================================================

function initAnimations() {
  // Animate stats counter for question count
  const qEl = DOM.questionCount();
  if (qEl) {
    let count = Math.floor(Math.random() * 500) + 5820;
    qEl.textContent = count.toLocaleString();
    state.questionCount = 0;
  }

  // Stagger quick action buttons entrance
  setTimeout(() => {
    document.querySelectorAll('.qa-btn').forEach((btn, i) => {
      btn.style.animationDelay = `${i * 60}ms`;
      btn.style.animation = 'messageIn 0.4s var(--ease-out) forwards';
    });
  }, 100);
}

// ================================================================
// MAIN INITIALIZATION
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🌍 CivicAI — Global Civic Assistant', 'color: #6366f1; font-size: 18px; font-weight: bold;');
  console.log('%cWorld-wide Government Services AI v2.0.0', 'color: #06b6d4; font-size: 12px;');

  // Build dynamic components
  buildQuickActions();

  // Show welcome message
  showWelcomeMessage();

  // Attach all event listeners
  attachEventListeners();

  // Init animations
  initAnimations();

  // Check API health
  checkApiHealth();

  // Focus input on load
  setTimeout(() => DOM.chatInput()?.focus(), 500);

  // Handle browser language detection
  const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
  if (browserLang && LANG_GREETINGS[browserLang] && browserLang !== 'en') {
    const langOption = document.querySelector(`.lang-option[data-lang="${browserLang}"]`);
    if (langOption) {
      // Subtle auto-detect — show toast but don't force switch
      setTimeout(() => {
        showToast(`🌍 Detected: ${langOption.dataset.name} — click 🌐 to switch`);
      }, 2000);
    }
  }
});

// ================================================================
// SERVICE WORKER (for offline caching — optional progressive enhancement)
// ================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Disabled for dev — enable for production
    // navigator.serviceWorker.register('/sw.js');
  });
}
