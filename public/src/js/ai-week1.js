// ai-week1.js — FarmBot Floating Chatbot & Crop Auto-Fill Module

(function () {
  'use strict';

  const BASE =
    (window.__ENV && window.__ENV.EDGE_FUNCTION_BASE_URL) ||
    'https://utrqtyocuziqsxwborup.functions.supabase.co';

  function getToken() {
    return (
      sessionStorage.getItem('sessionToken') ||
      localStorage.getItem('sessionToken') ||
      window.__SUPABASE_ACCESS_TOKEN__ ||
      ''
    );
  }

  async function callAIChat(body) {
    const token = getToken();
    const res = await fetch(`${BASE}/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  let chatHistory = [];

  // ════════════════════════════════════════════════════════════════
  // 1. FLOATING FARMBOT CHAT WIDGET
  // ════════════════════════════════════════════════════════════════

  function injectFarmBotWidget() {
    if (document.getElementById('farmbot-launcher')) return;

    // Load CSS dynamically
    if (!document.querySelector('link[href="src/css/ai-week1.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'src/css/ai-week1.css';
      document.head.appendChild(link);
    }

    // Launcher button
    const launcher = document.createElement('button');
    launcher.id = 'farmbot-launcher';
    launcher.className = 'farmbot-launcher';
    launcher.title = 'Ask FarmBot AI Advisor';
    launcher.innerHTML = `🤖<span class="farmbot-badge"></span>`;

    // Window HTML
    const windowDiv = document.createElement('div');
    windowDiv.id = 'farmbot-window';
    windowDiv.className = 'farmbot-window';
    windowDiv.innerHTML = `
      <div class="farmbot-header">
        <div class="farmbot-header-info">
          <div class="farmbot-avatar">🤖</div>
          <div>
            <div class="farmbot-title">FarmBot Advisor</div>
            <div class="farmbot-subtitle">24/7 AI Agricultural Co-Pilot</div>
          </div>
        </div>
        <button class="farmbot-close-btn" id="farmbot-close">&times;</button>
      </div>

      <div class="farmbot-body" id="farmbot-messages">
        <div class="farmbot-msg bot">
          <div class="farmbot-msg-bubble">
            👋 Hello! I am <b>FarmBot</b>. Ask me anything about crop care, fertilizer schedules, or weather protection for your farms!
          </div>
        </div>
        <div class="farmbot-chips">
          <button class="farmbot-chip" data-q="How to improve yield for my crops?">🌱 Yield tips</button>
          <button class="farmbot-chip" data-q="What fertilizer schedule should I follow?">🧪 Fertilizer advice</button>
          <button class="farmbot-chip" data-q="How to protect against pest attacks?">🐛 Pest protection</button>
        </div>
      </div>

      <div class="farmbot-footer">
        <input type="text" class="farmbot-input" id="farmbot-input" placeholder="Ask FarmBot..." />
        <button class="farmbot-send-btn" id="farmbot-send"><i class="fas fa-paper-plane"></i></button>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(windowDiv);

    // Event listeners
    launcher.addEventListener('click', () => {
      windowDiv.classList.toggle('open');
      if (windowDiv.classList.contains('open')) {
        document.getElementById('farmbot-input')?.focus();
      }
    });

    document.getElementById('farmbot-close')?.addEventListener('click', () => {
      windowDiv.classList.remove('open');
    });

    document.getElementById('farmbot-send')?.addEventListener('click', handleSend);

    document.getElementById('farmbot-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    // Chips event delegation
    document.getElementById('farmbot-messages')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('farmbot-chip')) {
        const q = e.target.dataset.q;
        if (q) sendQuery(q);
      }
    });
  }

  async function handleSend() {
    const input = document.getElementById('farmbot-input');
    const msg = input?.value?.trim();
    if (!msg) return;
    input.value = '';
    await sendQuery(msg);
  }

  async function sendQuery(text) {
    const container = document.getElementById('farmbot-messages');
    if (!container) return;

    // Add user message to UI
    appendMsg(container, 'user', text);
    chatHistory.push({ role: 'user', content: text });

    // Loading indicator
    const loadingId = 'loading-' + Date.now();
    appendMsg(container, 'bot', '⏳ Thinking...', loadingId);

    try {
      const res = await callAIChat({
        mode: 'chat',
        message: text,
        history: chatHistory,
      });

      document.getElementById(loadingId)?.remove();

      if (res.success && res.data?.response) {
        const botReply = res.data.response;
        appendMsg(container, 'bot', botReply);
        chatHistory.push({ role: 'assistant', content: botReply });
      } else {
        appendMsg(container, 'bot', '⚠️ ' + (res.error || 'Could not connect to FarmBot AI.'));
      }
    } catch (err) {
      document.getElementById(loadingId)?.remove();
      appendMsg(container, 'bot', '❌ Network error connecting to FarmBot.');
    }
  }

  function appendMsg(container, role, text, id = null) {
    const div = document.createElement('div');
    div.className = `farmbot-msg ${role}`;
    if (id) div.id = id;
    div.innerHTML = `<div class="farmbot-msg-bubble">${formatText(text)}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function formatText(t) {
    return String(t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  }

  // ════════════════════════════════════════════════════════════════
  // 2. AI CROP REGISTRATION AUTO-FILL (For crops.html)
  // ════════════════════════════════════════════════════════════════

  function setupCropAutofill() {
    const cropNameInput = document.getElementById('cropName');
    if (!cropNameInput) return;

    const label = cropNameInput.previousElementSibling || cropNameInput.parentNode.querySelector('label');
    if (label && !document.getElementById('ai-autofill-crop-btn')) {
      const btn = document.createElement('button');
      btn.id = 'ai-autofill-crop-btn';
      btn.className = 'ai-autofill-btn';
      btn.type = 'button';
      btn.innerHTML = `✨ AI Suggest`;
      label.appendChild(btn);

      btn.addEventListener('click', async () => {
        const name = cropNameInput.value.trim();
        if (!name) {
          alert('Please enter a crop name first (e.g. Wheat, Maize, Cotton).');
          return;
        }

        btn.textContent = '⏳ Thinking...';
        btn.disabled = true;

        try {
          const res = await callAIChat({ mode: 'autofill', crop_name: name });
          if (res.success && res.data) {
            const d = res.data;
            if (d.crop_type) setVal('cropType', d.crop_type);
            if (d.crop_variety) setVal('cropVariety', d.crop_variety);
            if (d.ideal_soil) setVal('soilType', d.ideal_soil);
            if (d.expected_yield_per_acre) setVal('expectedYield', d.expected_yield_per_acre);
            if (d.notes) setVal('cropNotes', d.notes);

            // Auto set expected harvest date if sowing date present
            const sowingInput = document.getElementById('sowingDate');
            if (sowingInput?.value && d.typical_duration_days) {
              const sow = new Date(sowingInput.value);
              sow.setDate(sow.getDate() + d.typical_duration_days);
              setVal('expectedHarvest', sow.toISOString().split('T')[0]);
            }

            alert(`✨ Auto-filled data for ${name}!`);
          }
        } catch (err) {
          alert('Failed to get AI suggestions.');
        } finally {
          btn.innerHTML = `✨ AI Suggest`;
          btn.disabled = false;
        }
      });
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  // ════════════════════════════════════════════════════════════════
  // INITIALIZE ON DOM LOAD
  // ════════════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', () => {
    injectFarmBotWidget();
    setupCropAutofill();
  });
})();
