(function() {
  const CLIENT_KEY = window.__LUCY_CLIENT_KEY__ || "dev-client-key";
  const BASE_URL = window.location.origin;
  const API_URL = `${BASE_URL}/api/support`;
  const CONFIG_URL = `${BASE_URL}/api/widget-config?key=${CLIENT_KEY}`;

  let config = {
    bot_name: "Lucy AI",
    theme_color: "#4F46E5",
    user_msg_color: "#4F46E5",
    bot_msg_color: "#ffffff",
    send_btn_color: "#4F46E5",
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
    const style = document.createElement('style');
    style.innerHTML = `
      #lucy-widget-container {
        position: fixed; bottom: 20px; right: 20px;
        z-index: 9999; font-family: 'Inter', -apple-system, sans-serif;
      }
      #lucy-chat-bubble {
        width: 60px; height: 60px;
        background: ${config.theme_color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }
      #lucy-chat-bubble:hover { transform: scale(1.05); }
      #lucy-chat-bubble svg { width: 28px; height: 28px; fill: white; }

      #lucy-chat-window {
        position: absolute; bottom: 80px; right: 0;
        width: 360px; height: 550px;
        background: white; border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.15);
        display: none; flex-direction: column;
        overflow: hidden; border: 1px solid #eee;
      }
      #lucy-chat-window.active { display: flex; }

      .lucy-header { background: ${config.theme_color}; color: white; padding: 18px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
      .lucy-messages { flex: 1; overflow-y: auto; padding: 20px; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; }
      .lucy-msg { padding: 10px 14px; border-radius: 14px; font-size: 14px; max-width: 85%; line-height: 1.5; }
      .lucy-msg.user { background: ${config.user_msg_color}; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
      .lucy-msg.assistant { background: ${config.bot_msg_color}; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e2e8f0; }
      
      .lucy-footer { padding: 15px; border-top: 1px solid #eee; background: white; }
      .lucy-input-row { display: flex; gap: 10px; align-items: center; }
      .lucy-input { flex: 1; border: 1px solid #e2e8f0; border-radius: 24px; padding: 10px 16px; outline: none; font-size: 14px; transition: border 0.2s; }
      .lucy-input:focus { border-color: ${config.theme_color}; }
      .lucy-send { background: ${config.send_btn_color}; color: white; border: none; border-radius: 50%; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
      .lucy-send:hover { opacity: 0.9; }
      .lucy-mic { background: transparent; color: #64748b; border: 1px solid #e2e8f0; border-radius: 50%; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .lucy-mic:hover { color: ${config.theme_color}; border-color: ${config.theme_color}; background: #f8fafc; }
      .lucy-mic.listening { background: #ef4444; color: white; border-color: #ef4444; animation: pulse 1.5s infinite; }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'lucy-widget-container';
    container.innerHTML = `
      <div id="lucy-chat-window">
        <div class="lucy-header">
          <span>${config.bot_name}</span>
          <span style="cursor:pointer; font-size: 20px;" id="lucy-close">&times;</span>
        </div>
        <div id="lucy-messages" class="lucy-messages"></div>
        <div class="lucy-footer">
          <div class="lucy-input-row">
            <button id="lucy-mic" class="lucy-mic" title="Speak">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>
            <input type="text" id="lucy-input" class="lucy-input" placeholder="Ask a question...">
            <button id="lucy-send" class="lucy-send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
      <div id="lucy-chat-bubble">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
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
    const micBtn = document.getElementById('lucy-mic');

    bubble.addEventListener('click', () => {
      windowEl.classList.toggle('active');
      if(windowEl.classList.contains('active')) inputEl.focus();
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      windowEl.classList.remove('active');
    });

    sendBtn.addEventListener('click', () => sendMessage());
    inputEl.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendMessage(); });
    
    // Voice Logic (using MediaRecorder for HF MMS ASR)
    let mediaRecorder;
    let audioChunks = [];

    micBtn.addEventListener('click', async () => {
      if (micBtn.classList.contains('listening')) {
        mediaRecorder.stop();
        micBtn.classList.remove('listening');
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            micBtn.classList.add('processing');
            
            try {
              const res = await fetch(`${BASE_URL}/api/asr?lang=amh`, {
                method: 'POST',
                body: audioBlob
              });
              const data = await res.json();
              if (data.text) {
                inputEl.value = data.text;
                sendMessage(true);
              }
            } catch (e) { console.error("ASR Error", e); }
            micBtn.classList.remove('processing');
          };

          mediaRecorder.start();
          micBtn.classList.add('listening');
        } catch (e) {
          console.error("Mic access denied", e);
        }
      }
    });
  }

  async function speakText(text) {
    try {
      const res = await fetch(`${BASE_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, lang: 'am' })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) { console.error("TTS Error", e); }
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

  async function sendMessage(enableTTS = false) {
    const inputEl = document.getElementById('lucy-input');
    const text = inputEl.value.trim();
    if(!text) return;
    
    appendMsg(text, 'user');
    inputEl.value = '';

    const history = getHistory();
    const context = history.map(m => `${m.role}: ${m.content}`).join("\n");

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': CLIENT_KEY },
        body: JSON.stringify({ 
          user_query: text, 
          context: context,
          language: 'am', // Default to Amharic
          sector: 'admin_defined' 
        })
      });
      const data = await res.json();
      appendMsg(data.reply, 'assistant');
      
      if(enableTTS) speakText(data.reply);

      history.push({role: 'user', content: text});
      history.push({role: 'assistant', content: data.reply});
      saveHistory(history);
    } catch(e) {
      appendMsg("Sorry, I'm having trouble connecting.", 'assistant');
    }
  }

  initWidget();
})();