// ai-week2.js — Week 2 Gen AI Frontend Module
// Handles: Yield Predictor, Inventory Anomaly Alerts, Growth Timeline
// Depends on: api.js (window.FarmerAPI) being loaded first

(function () {
  'use strict';

  // ── Edge Function base URL (same as api.js) ──────────────────────
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

  async function callAI(path, method = 'GET', body = null) {
    const token = getToken();
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    return res.json();
  }

  // ── Expose to window.SFMS_AI ────────────────────────────────────
  window.SFMS_AI = {
    getYieldPrediction,
    getInventoryAlerts,
    renderYieldForecastSection,
    renderInventoryAlertsSection,
    initReport,
    initInventory,
  };

  // ════════════════════════════════════════════════════════════════
  // YIELD PREDICTOR
  // ════════════════════════════════════════════════════════════════

  async function getYieldPrediction(cropData) {
    return callAI('/ai-yield', 'POST', cropData);
  }

  /**
   * Renders the full AI Yield Forecast section into a container element.
   * @param {HTMLElement} container
   * @param {Array} crops — array of crop objects from FarmerAPI.getCrops()
   */
  function renderYieldForecastSection(container, crops) {
    if (!container) return;

    container.innerHTML = `
      <div class="ai-section">
        <div class="ai-section-header">
          <h2>🤖 AI Yield Forecast</h2>
          <span class="ai-badge">✨ Gemini AI</span>
        </div>

        <div class="yield-crop-selector" style="margin-bottom:1rem;">
          <label for="ai-crop-select" style="font-size:0.875rem;color:var(--text-secondary);font-weight:500;">
            Select crop to analyze:
          </label>
          <select id="ai-crop-select">
            <option value="">-- Choose a crop --</option>
            ${(crops || []).map((c) => `<option value="${c.crop_id}" data-crop='${JSON.stringify(c).replace(/'/g, "&#39;")}'>${c.crop_name}${c.farm_name ? ` (${c.farm_name})` : ''}</option>`).join('')}
          </select>
          <button class="ai-trigger-btn" id="ai-yield-btn" type="button">
            <span class="btn-icon">🔮</span>
            <span class="ai-spinner"></span>
            Predict Yield
          </button>
        </div>

        <div id="ai-yield-result"></div>
      </div>
    `;

    document.getElementById('ai-yield-btn')?.addEventListener('click', onYieldBtnClick);
  }

  async function onYieldBtnClick() {
    const select = document.getElementById('ai-crop-select');
    const btn = document.getElementById('ai-yield-btn');
    const result = document.getElementById('ai-yield-result');
    if (!select || !btn || !result) return;

    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption?.dataset?.crop) {
      result.innerHTML = `<div class="ai-error-banner">⚠️ Please select a crop first.</div>`;
      return;
    }

    let crop;
    try {
      crop = JSON.parse(selectedOption.dataset.crop.replace(/&#39;/g, "'"));
    } catch {
      result.innerHTML = `<div class="ai-error-banner">⚠️ Could not read crop data.</div>`;
      return;
    }

    // Show loading state
    btn.classList.add('loading');
    btn.disabled = true;
    result.innerHTML = renderYieldSkeleton();

    try {
      // Get user profile for location context
      let location = 'India';
      try {
        const profile = await window.FarmerAPI?.getProfile?.();
        if (profile?.data?.city || profile?.data?.state) {
          location = [profile.data.city, profile.data.state].filter(Boolean).join(', ');
        }
      } catch (_) {}

      const resp = await getYieldPrediction({
        crop_id: crop.crop_id,
        crop_name: crop.crop_name,
        area: crop.area,
        soil_type: crop.soil_type,
        sowing_date: crop.sowing_date,
        expected_yield: crop.expected_yield,
        actual_yield: crop.actual_yield,
        crop_type: crop.crop_type,
        location,
      });

      if (!resp.success || !resp.data) {
        throw new Error(resp.error || 'Prediction failed');
      }

      result.innerHTML = renderYieldCard(crop.crop_name, resp.data);
      // Animate the bar after render
      requestAnimationFrame(() => {
        const fill = result.querySelector('.yield-range-fill');
        if (fill) fill.style.width = fill.dataset.width;
        const scoreFill = result.querySelector('.health-score-fill');
        if (scoreFill) scoreFill.style.width = scoreFill.dataset.width;
      });
    } catch (err) {
      result.innerHTML = `<div class="ai-error-banner">❌ ${err.message || 'AI prediction failed. Check your API key setup.'}</div>`;
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  function renderYieldCard(cropName, p) {
    const confidenceClass =
      p.confidence_pct >= 75 ? 'high' : p.confidence_pct >= 55 ? 'medium' : 'low';
    const barWidth = Math.max(20, Math.min(100, p.confidence_pct));

    const risks = (p.risks || [])
      .map((r) => `<li>${escHtml(r)}</li>`)
      .join('');
    const tips = (p.tips || [])
      .map((t) => `<li>${escHtml(t)}</li>`)
      .join('');

    const timelineHtml = renderTimeline(p.growth_stages || []);

    return `
      <div class="yield-forecast-card">
        <div class="yield-header">
          <div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);">
              📊 ${escHtml(cropName)} Yield Prediction
            </div>
            <div class="yield-summary">${escHtml(p.summary || '')}</div>
          </div>
          <span class="confidence-badge ${confidenceClass}">
            ${p.confidence_pct}% confidence
          </span>
        </div>

        <div class="yield-values">
          <div class="yield-value-box">
            <div class="yield-value-label">Min Yield</div>
            <div class="yield-value-number">${p.predicted_min}</div>
            <div class="yield-value-unit">${p.unit || 'tons'}</div>
          </div>
          <div class="yield-value-box">
            <div class="yield-value-label">Max Yield</div>
            <div class="yield-value-number">${p.predicted_max}</div>
            <div class="yield-value-unit">${p.unit || 'tons'}</div>
          </div>
          <div class="yield-value-box">
            <div class="yield-value-label">Confidence</div>
            <div class="yield-value-number">${p.confidence_pct}%</div>
            <div class="yield-value-unit">accuracy</div>
          </div>
        </div>

        <div class="yield-range-bar-wrap">
          <div class="yield-range-labels">
            <span>Prediction confidence</span>
            <span>${p.confidence_pct}%</span>
          </div>
          <div class="yield-range-track">
            <div class="yield-range-fill" data-width="${barWidth}%" style="width:0"></div>
          </div>
        </div>

        <div class="yield-insights">
          <div class="insight-panel risks">
            <div class="insight-panel-title risks">⚠️ Risk Factors</div>
            <ul class="insight-list">${risks || '<li>No significant risks identified.</li>'}</ul>
          </div>
          <div class="insight-panel tips">
            <div class="insight-panel-title tips">✅ Actionable Tips</div>
            <ul class="insight-list">${tips || '<li>Continue current farming practices.</li>'}</ul>
          </div>
        </div>

        ${timelineHtml}
      </div>
    `;
  }

  function renderTimeline(stages) {
    if (!stages || stages.length === 0) return '';
    const today = new Date();

    const stepsHtml = stages
      .map((s, i) => {
        const stageDate = s.date ? new Date(s.date) : null;
        let stepClass = '';
        if (stageDate) {
          if (stageDate < today) stepClass = 'completed';
          else if (i === stages.findIndex((x) => new Date(x.date) >= today))
            stepClass = 'current';
        }
        const label =
          i === 0 ? '🌱' : i === 1 ? '🌿' : i === 2 ? '🌸' : '🌾';
        return `
          <div class="timeline-step ${stepClass}">
            <div class="timeline-dot">${label}</div>
            <div class="timeline-label">${escHtml(s.stage)}</div>
            <div class="timeline-date">${stageDate ? formatDate(stageDate) : 'TBD'}</div>
            <div class="timeline-desc">${escHtml(s.description || '')}</div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="growth-timeline">
        <div class="growth-timeline-title">📅 Growth Stage Timeline</div>
        <div class="timeline-track">${stepsHtml}</div>
      </div>
    `;
  }

  function renderYieldSkeleton() {
    return `
      <div class="yield-forecast-card">
        <div style="display:flex;gap:1rem;margin-bottom:1rem;">
          <div class="ai-skeleton" style="height:32px;flex:1;"></div>
          <div class="ai-skeleton" style="height:32px;width:120px;"></div>
        </div>
        <div style="display:flex;gap:1rem;margin-bottom:1rem;">
          ${[1,2,3].map(() => `<div class="ai-skeleton" style="height:80px;flex:1;border-radius:0.75rem;"></div>`).join('')}
        </div>
        <div class="ai-skeleton" style="height:10px;margin-bottom:1rem;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div class="ai-skeleton" style="height:120px;border-radius:0.75rem;"></div>
          <div class="ai-skeleton" style="height:120px;border-radius:0.75rem;"></div>
        </div>
      </div>
    `;
  }

  // ════════════════════════════════════════════════════════════════
  // INVENTORY ANOMALY ALERTS
  // ════════════════════════════════════════════════════════════════

  async function getInventoryAlerts() {
    return callAI('/ai-inventory-check', 'GET');
  }

  /**
   * Renders the AI Inventory Alerts section into a container element.
   * Auto-fetches on render.
   * @param {HTMLElement} container
   */
  async function renderInventoryAlertsSection(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="ai-section">
        <div class="ai-section-header">
          <h2>🤖 AI Inventory Intelligence</h2>
          <span class="ai-badge">✨ Gemini AI</span>
          <button class="ai-trigger-btn" id="ai-inv-refresh-btn" type="button" style="margin-left:auto;">
            <span class="btn-icon">🔄</span>
            <span class="ai-spinner"></span>
            Scan Inventory
          </button>
        </div>
        <div id="ai-inv-result">
          ${renderAlertsSkeleton()}
        </div>
      </div>
    `;

    document.getElementById('ai-inv-refresh-btn')?.addEventListener('click', () =>
      fetchAndRenderAlerts()
    );

    // Auto-load
    await fetchAndRenderAlerts();
  }

  async function fetchAndRenderAlerts() {
    const result = document.getElementById('ai-inv-result');
    const btn = document.getElementById('ai-inv-refresh-btn');
    if (!result) return;

    if (btn) { btn.classList.add('loading'); btn.disabled = true; }
    result.innerHTML = renderAlertsSkeleton();

    try {
      const resp = await getInventoryAlerts();
      if (!resp.success || !resp.data) throw new Error(resp.error || 'Analysis failed');
      result.innerHTML = renderAlertsHtml(resp.data);
      // Animate health bar
      requestAnimationFrame(() => {
        const fill = result.querySelector('.health-score-fill');
        if (fill) fill.style.width = fill.dataset.width;
      });
    } catch (err) {
      result.innerHTML = `<div class="ai-error-banner">❌ ${err.message || 'AI analysis failed.'}</div>`;
    } finally {
      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    }
  }

  function renderAlertsHtml(data) {
    const { alerts, summary, health_score, checked_at } = data;
    const scoreWidth = Math.max(5, Math.min(100, health_score));
    const scoreColor =
      health_score >= 75 ? '#22c55e' : health_score >= 50 ? '#f59e0b' : '#dc2626';

    const checkedTime = checked_at
      ? `Last checked: ${new Date(checked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      : '';

    let alertsHtml = '';
    if (!alerts || alerts.length === 0) {
      alertsHtml = `
        <div class="ai-empty-state">
          <div class="ai-empty-icon">✅</div>
          <p>All clear! Your inventory looks healthy for your current crops.</p>
        </div>
      `;
    } else {
      alertsHtml = `<div class="ai-alerts-wrapper">` +
        alerts.map((a) => `
          <div class="ai-alert-banner ${a.severity}">
            <div class="ai-alert-icon">${a.icon || (a.severity === 'high' ? '🚨' : a.severity === 'medium' ? '⚠️' : 'ℹ️')}</div>
            <div class="ai-alert-body">
              <div class="ai-alert-title">${escHtml(a.title)}</div>
              <div class="ai-alert-msg">${escHtml(a.message)}</div>
              <div class="ai-alert-action">→ ${escHtml(a.action)}</div>
            </div>
          </div>
        `).join('') +
        `</div>`;
    }

    return `
      <div class="inventory-health-score">
        <div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.15rem;">Inventory Health</div>
          <div class="health-score-number" style="color:${scoreColor};">${health_score}/100</div>
        </div>
        <div class="health-score-bar">
          <div class="health-score-fill" data-width="${scoreWidth}%" style="width:0;background:${scoreColor};"></div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-tertiary);text-align:right;">${checkedTime}</div>
      </div>
      <div class="yield-summary">${escHtml(summary || '')}</div>
      ${alertsHtml}
    `;
  }

  function renderAlertsSkeleton() {
    return `
      <div>
        <div class="ai-skeleton" style="height:60px;border-radius:0.75rem;margin-bottom:0.75rem;"></div>
        <div class="ai-skeleton" style="height:40px;border-radius:0.5rem;margin-bottom:0.5rem;"></div>
        <div class="ai-skeleton" style="height:70px;border-radius:0.75rem;margin-bottom:0.5rem;"></div>
        <div class="ai-skeleton" style="height:70px;border-radius:0.75rem;"></div>
      </div>
    `;
  }

  // ════════════════════════════════════════════════════════════════
  // PAGE INITIALIZERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Call this on report.html after page data loads.
   * Injects the yield forecast section before the charts.
   */
  async function initReport() {
    // Ensure CSS is loaded
    loadCSS('src/css/ai-week2.css');

    const chartsSection = document.querySelector('.charts-section');
    if (!chartsSection) return;

    // Create AI section container
    const aiContainer = document.createElement('div');
    aiContainer.id = 'ai-yield-section';
    chartsSection.parentNode.insertBefore(aiContainer, chartsSection);

    // Load crops to populate the selector
    let crops = [];
    try {
      const cropsResp = await window.FarmerAPI?.getCrops?.(50);
      if (cropsResp?.success) crops = cropsResp.data || [];
    } catch (_) {}

    renderYieldForecastSection(aiContainer, crops);
  }

  /**
   * Call this on inventory.html after page data loads.
   * Injects the AI alerts banner above the inventory table.
   */
  async function initInventory() {
    loadCSS('src/css/ai-week2.css');

    // Find insertion point: before the main inventory content
    const target =
      document.querySelector('.inventory-section') ||
      document.querySelector('.inventory-grid') ||
      document.querySelector('.main-content > *:nth-child(2)') ||
      document.querySelector('main');

    if (!target) return;

    const aiContainer = document.createElement('div');
    aiContainer.id = 'ai-inventory-section';

    // Insert before target's first child or before target itself
    if (target.parentNode && target !== document.querySelector('main')) {
      target.parentNode.insertBefore(aiContainer, target);
    } else {
      target.prepend(aiContainer);
    }

    await renderInventoryAlertsSection(aiContainer);
  }

  // ════════════════════════════════════════════════════════════════
  // UTILITIES
  // ════════════════════════════════════════════════════════════════

  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
})();
