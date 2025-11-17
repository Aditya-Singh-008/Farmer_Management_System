// reports.js - dynamic reports dashboard
document.addEventListener('DOMContentLoaded', () => {
  setupRevenueRangeToggle();
  setupExportReport();
  loadReportStats();
});

let revenueChartInstance = null;
let yieldChartInstance = null;
let currentSalesCache = [];
let currentAuthId = null;
let currentRevenueRange = 'month'; // day | week | month
let currentSnapshot = null;

async function loadReportStats() {
  const authId = getAuthId();
  currentAuthId = authId;
  const notice = document.getElementById('demoNotice');
  // Parallel fetches
  const [ordersRes, listingsRes, cropsRes, farmsRes] = await Promise.allSettled([
    window.FarmerAPI?.getOrders ? window.FarmerAPI.getOrders(200) : null,
    window.FarmerAPI?.getListings ? window.FarmerAPI.getListings(200) : null,
    window.FarmerAPI?.getCrops ? window.FarmerAPI.getCrops(200) : null,
    window.FarmerAPI?.getFarms ? window.FarmerAPI.getFarms(200) : null,
  ]);

  const ordersPayload = ordersRes.status === 'fulfilled' && ordersRes.value?.success ? (ordersRes.value.data ?? ordersRes.value) : { sales: [], purchases: [] };
  currentSalesCache = Array.isArray(ordersPayload.sales) ? ordersPayload.sales : [];
  const listings = listingsRes.status === 'fulfilled' && listingsRes.value?.success ? listingsRes.value.data || [] : [];
  const crops = cropsRes.status === 'fulfilled' && cropsRes.value?.success ? cropsRes.value.data || [] : [];
  const farms = farmsRes.status === 'fulfilled' && farmsRes.value?.success ? farmsRes.value.data || [] : [];

  const { totalRevenue, acceptedRevenue } = computeRevenue(ordersPayload, authId);
  renderRevenue(totalRevenue, acceptedRevenue);

  const { totalYield, completedCount, yieldByMonth, yieldByCrop } = computeYield(crops);
  renderYield(totalYield, completedCount);

  const { avgPrice, count } = computeAvgPrice(listings, authId);
  renderAvgPrice(avgPrice, count);

  renderFarms(farms);

  const revenueSeries = buildRevenueSeries(currentSalesCache, authId, currentRevenueRange);
  const monthlyRevenue = buildRevenueSeries(currentSalesCache, authId, 'month');

  renderRevenueChart(revenueSeries, currentRevenueRange);
  renderYieldChart(yieldByCrop);
  renderPerformanceTable(monthlyRevenue, yieldByMonth, farms.length, avgPrice);

  currentSnapshot = {
    totals: {
      totalRevenue,
      acceptedRevenue,
      totalYield,
      completedCrops: completedCount,
      avgPrice,
      listingsCount: count,
      farmsCount: farms.length
    },
    revenueSeries,
    monthlyRevenue,
    yieldByMonth,
    yieldByCrop,
    fetchedAt: new Date().toISOString()
  };

  if (notice) notice.classList.toggle('hidden', !!(listings.length || crops.length || monthlyRevenue.length));
}

function getAuthId() {
  try {
    const authUserId = sessionStorage.getItem('authUserId');
    if (authUserId) return authUserId;
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.authUserId) return parsed.authUserId;
      if (parsed?.id) return parsed.id;
    }
  } catch (_) {}
  if (window.currentProfile?.user_id) return window.currentProfile.user_id;
  if (window.currentUser?.id) return window.currentUser.id;
  return null;
}

function computeRevenue(ordersPayload, authId) {
  const sales = Array.isArray(ordersPayload.sales) ? ordersPayload.sales : [];
  const isMine = (row) => {
    const sellerId = row.farms?.user_id || row.marketplace_listings?.farms?.user_id || row.seller_id;
    return authId && sellerId && String(sellerId) === String(authId);
  };
  const relevant = sales.filter(isMine);
  const total = relevant.reduce((sum, o) => sum + Number(o.total_price ?? o.total ?? 0), 0);
  const accepted = relevant
    .filter((o) => ['accepted', 'shipped', 'completed'].includes((o.status || '').toLowerCase()))
    .reduce((sum, o) => sum + Number(o.total_price ?? o.total ?? 0), 0);
  return { totalRevenue: total, acceptedRevenue: accepted };
}

function computeAvgPrice(listings, authId) {
  const mine = authId ? listings.filter((l) => String(l.owner_id || l.farms?.user_id) === String(authId)) : listings;
  if (!mine.length) return { avgPrice: 0, count: 0 };
  const sum = mine.reduce((s, l) => s + Number(l.price_per_unit ?? l.price ?? 0), 0);
  return { avgPrice: mine.length ? sum / mine.length : 0, count: mine.length };
}

function computeYield(crops) {
  const normalizeYield = (c) => {
    // Prefer saved estimates, then expected/actual, finally a light area fallback
    const val =
      Number(c.estimated_yield) ||
      Number(c.expected_yield) ||
      Number(c.actual_yield) ||
      (c.area ? Number(c.area) * 1.5 : 0);
    return Number.isFinite(val) ? Number(val) : 0;
  };

  const completed = crops.filter((c) => (c.status || '').toLowerCase() === 'completed');
  const totalYield = crops.reduce((sum, c) => sum + normalizeYield(c), 0);

  // Group yield by month (expected_harvest or updated_at) and by crop name
  const yieldByMonth = {};
  const yieldByCrop = {};
  crops.forEach((c) => {
    const label = formatMonth(c.expected_harvest || c.harvest_date || c.updated_at || c.created_at || new Date());
    const val = normalizeYield(c);
    yieldByMonth[label] = (yieldByMonth[label] || 0) + val;
    const cropName = c.crop_name || c.crop || 'Other';
    yieldByCrop[cropName] = (yieldByCrop[cropName] || 0) + val;
  });

  return { totalYield, completedCount: completed.length, yieldByMonth, yieldByCrop };
}

function renderRevenue(total, accepted) {
  setText('totalRevenue', formatCurrency(total));
  setText('acceptedRevenue', `Accepted: ${formatCurrency(accepted)}`);
}

function renderYield(totalYield, completedCount) {
  setText('totalYield', totalYield ? `${totalYield.toLocaleString()} tons` : '--');
  setText('completedCrops', `Completed crops: ${completedCount || 0}`);
}

function renderAvgPrice(avg, count) {
  setText('avgPrice', `${formatCurrency(avg)}/kg`);
  setText('listingCount', `Listings: ${count || 0}`);
}

function renderFarms(farms) {
  setText('activeFields', farms?.length || 0);
  setText('farmRegions', farms?.length ? `Your farms (${farms.length})` : 'Your farms');
}

function buildRevenueSeries(sales, authId, range = 'month') {
  const config = {
    day: { windowDays: 30, bucket: 'day' },
    week: { windowDays: 90, bucket: 'week' },
    month: { windowDays: 365, bucket: 'month' },
  };
  const acceptedStatuses = ['accepted', 'shipped', 'completed'];
  const isMine = (row) => {
    const sellerId = row.farms?.user_id || row.marketplace_listings?.farms?.user_id || row.seller_id;
    return authId && sellerId && String(sellerId) === String(authId);
  };

  const cfg = config[range] || config.month;
  const cutoff = Date.now() - cfg.windowDays * 24 * 60 * 60 * 1000;
  const groups = {};

  (sales || [])
    .filter(isMine)
    .forEach((o) => {
      const dateVal = o.ordered_on || o.created_at || new Date();
      const d = new Date(dateVal);
      if (!Number.isFinite(d.getTime()) || d.getTime() < cutoff) return;

      let label = '';
      let sortKey = 0;
      if (cfg.bucket === 'day') {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        sortKey = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      } else if (cfg.bucket === 'week') {
        const { year, week } = getISOWeek(d);
        label = `W${week} ${year}`;
        sortKey = year * 100 + week;
      } else {
        label = formatMonth(d);
        sortKey = parseMonthKey(label);
      }

      const total = Number(o.total_price ?? o.total ?? 0);
      const isAccepted = acceptedStatuses.includes((o.status || '').toLowerCase());
      if (!groups[label]) groups[label] = { revenue: 0, accepted: 0, sortKey };
      groups[label].revenue += total;
      if (isAccepted) groups[label].accepted += total;
    });

  return Object.entries(groups)
    .map(([label, val]) => ({ label, ...val }))
    .sort((a, b) => a.sortKey - b.sortKey);
}

function renderRevenueChart(series, rangeLabel = 'month') {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  if (revenueChartInstance) revenueChartInstance.destroy();
  const labels = series.length ? series.map((m) => m.label) : ['No data'];
  const revenue = series.length ? series.map((m) => m.revenue) : [0];
  const accepted = series.length ? series.map((m) => m.accepted) : [0];
  const labelMap = { day: 'Daily', week: 'Weekly', month: 'Monthly' };
  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `${labelMap[rangeLabel] || 'Revenue'} Revenue`,
          data: revenue,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.12)',
          tension: 0.35,
          fill: true,
        },
        {
          label: `${labelMap[rangeLabel] || 'Accepted'} Accepted`,
          data: accepted,
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.35,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom' } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function renderYieldChart(yieldByCrop) {
  const ctx = document.getElementById('yieldChart');
  if (!ctx) return;
  if (yieldChartInstance) yieldChartInstance.destroy();
  const entries = Object.entries(yieldByCrop || {});
  const labels = entries.length ? entries.map(([k]) => k) : ['No data'];
  const data = entries.length ? entries.map(([, v]) => v) : [1];
  yieldChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#4CAF50', '#FFC107', '#FF5722', '#2196F3', '#9E9E9E', '#06b6d4', '#8b5cf6'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  });
}

function renderPerformanceTable(monthlyRevenue, yieldByMonth, fieldCount, avgPrice) {
  const tbody = document.getElementById('performanceTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const merged = (monthlyRevenue.length ? monthlyRevenue : [{ label: 'No data', revenue: 0, accepted: 0, sortKey: 0 }])
    .map((row) => ({
      ...row,
      yield: yieldByMonth[row.label] || 0,
      fields: fieldCount || 0,
      avgPrice: avgPrice || 0,
    }))
    .sort((a, b) => b.sortKey - a.sortKey);

  merged.slice(0, 6).forEach((row) => {
    const tr = document.createElement('tr');
    const statusClass = row.revenue > 0 ? 'optimal' : 'normal';
    tr.innerHTML = `
      <td>${row.label}</td>
      <td>${formatCurrency(row.revenue)}</td>
      <td>${row.yield ? row.yield.toLocaleString() : '--'}</td>
      <td>${row.fields || 0}</td>
      <td>${formatCurrency(row.avgPrice).replace('₹', '')}</td>
      <td><span class="status-badge ${statusClass}">${statusClass === 'optimal' ? 'Optimal' : 'Normal'}</span></td>
    `;
    tbody.appendChild(tr);
  });

  if (!merged.length) {
    const tr = document.createElement('tr');
    tr.className = 'no-data';
    tr.innerHTML = `<td colspan="6">No data available</td>`;
    tbody.appendChild(tr);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(val) || 0);
}

function setupRevenueRangeToggle() {
  const buttons = document.querySelectorAll('.revenue-range-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const range = btn.dataset.revenueRange || 'month';
      currentRevenueRange = range;
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      if (currentSalesCache.length && currentAuthId) {
        const series = buildRevenueSeries(currentSalesCache, currentAuthId, currentRevenueRange);
        renderRevenueChart(series, currentRevenueRange);
      }
    });
  });
}

function setupExportReport() {
  const btn = document.getElementById('exportReportsBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!currentSnapshot) {
      alert('Report data is still loading. Please try again in a moment.');
      return;
    }
    const payload = {
      generated_at: new Date().toISOString(),
      snapshot: currentSnapshot
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `farm-report-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
}

function formatMonth(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function parseMonthKey(label) {
  const parts = label.split(' ');
  if (parts.length !== 2) return 0;
  const month = new Date(`${label} 01`).getMonth();
  const year = parseInt(parts[1], 10) || 0;
  return year * 12 + month;
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
