(function() {
  const CLIENT_KEY = window.__LUCY_CLIENT_KEY__ || "dev-client-key";
  const BASE_URL = window.location.origin; // Dynamically detect host
  const API_URL = `${BASE_URL}/api/support`;
  const CONFIG_URL = `${BASE_URL}/api/widget-config?key=${CLIENT_KEY}`;

  let config = {
    bot_name: "Lucy AI",
    theme_color: "#0d6efd",
    welcome_message: "Hello! How can I help you today?"
  };

  async function initWidget() {
    try {
      const res = await fetch(CONFIG_URL);
      const data = await res.json();
      config = { ...config, ...data };
    } catch(e) { console.error("Lucy AI: Failed to load config", e); }

    renderWidget();
  }

  function renderWidget() {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
      #lucy-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      #lucy-chat-bubble {
        width: 60px; height: 60px;
        background: ${config.theme_color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: transform 0.3s ease;
      }
      #lucy-chat-bubble:hover { transform: scale(1.1); }
      #lucy-chat-bubble svg { width: 30px; height: 30px; fill: white; }

      #lucy-chat-window {
        position: absolute; bottom: 80px; right: 0;
        width: 350px; height: 500px;
        background: white; border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: none; flex-direction: column;
        overflow: hidden; border: 1px solid #eee;
      }
      #lucy-chat-window.active { display: flex; }

      .lucy-header { background: ${config.theme_color}; color: white; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; }
      .lucy-messages { flex: 1; overflow-y: auto; padding: 15px; background: #f8f9fa; display: flex; flex-direction: column; }
      .lucy-msg { padding: 8px 12px; border-radius: 12px; margin-bottom: 10px; font-size: 14px; max-width: 80%; line-height: 1.4; }
      .lucy-msg.user { background: ${config.theme_color}; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
      .lucy-msg.assistant { background: white; color: #333; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #eee; }
      
      .lucy-footer { padding: 10px; border-top: 1px solid #eee; display: flex; gap: 5px; flex-direction: column; }
      .lucy-input-row { display: flex; gap: 5px; }
      .lucy-input { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 8px 15px; outline: none; }
      .lucy-send { background: ${config.theme_color}; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; }
      .lucy-controls { display: flex; gap: 5px; margin-top: 5px; }
      .lucy-select { font-size: 11px; border: 1px solid #ddd; border-radius: 4px; padding: 2px; }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML
    const container = document.createElement('div');
    container.id = 'lucy-widget-container';
    container.innerHTML = `
      <div id="lucy-chat-window">
        <div class="lucy-header">
          <span>${config.bot_name}</span>
          <span style="cursor:pointer" id="lucy-close">&times;</span>
        </div>
        <div id="lucy-messages" class="lucy-messages"></div>
        <div class="lucy-footer">
          <div class="lucy-controls">
            <select id="lucy-language" class="lucy-select">
              <option value="en">English</option>
              <option value="am">Amharic</option>
              <option value="om">Oromo</option>
              <option value="ti">Tigrinya</option>
              <option value="so">Somali</option>
            </select>
            <select id="lucy-sector" class="lucy-select">
              <option value="general">General</option>
              <option value="banking">Banking</option>
              <option value="telecom">Telecom</option>
            </select>
          </div>
          <div class="lucy-input-row">
            <input type="text" id="lucy-input" class="lucy-input" placeholder="Type a message...">
            <button id="lucy-send" class="lucy-send">➤</button>
          </div>
        </div>
      </div>
      <div id="lucy-chat-bubble">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      </div>
    `;
    document.body.appendChild(container);

    setupEvents();
    loadHistoryAndWelcome();
  }

  function setupEvents() {
    const bubble = document.getElementById('lucy-chat-bubble');
    const windowEl = document.getElementById('lucy-chat-window');
    const closeBtn = document.getElementById('lucy-close');
    const inputEl = document.getElementById('lucy-input');
    const sendBtn = document.getElementById('lucy-send');

    bubble.addEventListener('click', () => {
      windowEl.classList.toggle('active');
      if(windowEl.classList.contains('active')) inputEl.focus();
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      windowEl.classList.remove('active');
    });

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendMessage(); });
  }

  function loadHistoryAndWelcome() {
    const history = getHistory();
    if(history.length > 0) {
      history.forEach(m => appendMsg(m.content, m.role));
    } else {
      appendMsg(config.welcome_message, 'assistant');
    }
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem('lucy_chat_history') || "[]"); } 
    catch(e) { return []; }
  }

  function saveHistory(history) {
    localStorage.setItem('lucy_chat_history', JSON.stringify(history.slice(-10)));
  }

  function appendMsg(text, role) {
    const messagesEl = document.getElementById('lucy-messages');
    const div = document.createElement('div');
    div.className = `lucy-msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const inputEl = document.getElementById('lucy-input');
    const text = inputEl.value.trim();
    if(!text) return;
    
    appendMsg(text, 'user');
    inputEl.value = '';

    const history = getHistory();
    const context = history.map(m => `${m.role}: ${m.content}`).join("\n");
    const language = document.getElementById('lucy-language').value;
    const sector = document.getElementById('lucy-sector').value;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': CLIENT_KEY },
        body: JSON.stringify({ user_query: text, language, sector, context })
      });
      const data = await res.json();
      appendMsg(data.reply, 'assistant');
      
      history.push({role: 'user', content: text});
      history.push({role: 'assistant', content: data.reply});
      saveHistory(history);
    } catch(e) {
      appendMsg("Sorry, I'm having trouble connecting.", 'assistant');
    }
  }

  // Start
  initWidget();

})();
