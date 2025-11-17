// Minimal dynamic marketplace controller
const MARKETPLACE_CART_KEY = 'smartfarmer_marketplace_cart';
const DEFAULT_VISIBLE_COUNT = 12;

const state = {
  listings: [],
  filtered: [],
  visible: DEFAULT_VISIBLE_COUNT,
  stats: {},
  cart: [],
  currentListing: null,
  authId: null,
  showMineOnly: false,
  orders: { sales: [], purchases: [] }
};

document.addEventListener('DOMContentLoaded', () => {
  state.authId = getAuthId();
  restoreCart();
  attachEvents();
  loadListings();
  loadOrders();
});

async function loadListings(showToast = false) {
  setLoading(true);
  try {
    const res = window.FarmerAPI?.getListings ? await window.FarmerAPI.getListings(40) : null;
    if (res?.success && Array.isArray(res.data)) {
      state.listings = res.data.map(normalizeListing);
      document.getElementById('demoNotice')?.classList.toggle('hidden', !!state.listings.length);
      if (showToast) showNotification('Marketplace refreshed.', 'success');
    } else {
      state.listings = [];
      document.getElementById('demoNotice')?.classList.add('hidden');
      if (showToast) showNotification(res?.error || 'No listings available.', 'warning');
    }
  } catch (err) {
    console.error(err);
    state.listings = [];
    if (showToast) showNotification('Unable to reach marketplace.', 'error');
  } finally {
    setLoading(false);
    applyFilters();
    renderStats();
  }
}

function normalizeListing(row) {
  const farm = row.farms || {};
  const crop = row.crops || {};
  const sellerName = row.seller_name || farm.farmer_name || farm.owner_name || farm.farm_name || 'Farmer';
  return {
    id: row.listing_id || row.id,
    cropName: crop.crop_name || row.crop_name || 'Crop',
    cropType: (crop.crop_type || row.crop_type || 'general').toLowerCase(),
    farmName: farm.farm_name || row.farm_name || 'Farm',
    sellerName,
    ownerId: row.owner_id || farm.user_id || null,
    price: Number(row.price_per_unit ?? row.price ?? 0),
    quantity: Number(row.available_qty ?? row.quantity ?? 0),
    status: row.status || 'active',
    listedOn: row.listed_on || row.listedOn || new Date().toISOString(),
    harvest: crop.expected_harvest || row.expected_harvest || null
  };
}

function attachEvents() {
  document.getElementById('searchInput')?.addEventListener(
    'input',
    debounce((e) => {
      const term = e.target.value.trim().toLowerCase();
      state.searchTerm = term;
      applyFilters();
    }, 200)
  );

  document.getElementById('myListingsToggle')?.addEventListener('click', () => {
    state.showMineOnly = !state.showMineOnly;
    applyFilters();
    const btn = document.getElementById('myListingsToggle');
    if (btn) btn.textContent = state.showMineOnly ? 'Show All Listings' : 'Show My Listings';
  });

  // Disable remaining filter UI effects except search
  document.getElementById('loadMore')?.addEventListener('click', () => {
    state.visible += DEFAULT_VISIBLE_COUNT;
    renderListings();
  });

  document.getElementById('listingsGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = state.listings.find((l) => String(l.id) === String(id));
    if (!item) return;
    if (btn.dataset.action === 'view') openModal(item);
    if (btn.dataset.action === 'cart') addToCart(item, 1);
  });

  document.getElementById('addToCartModal')?.addEventListener('click', () => {
    if (!state.currentListing) return;
    const qty = Number(document.getElementById('orderQty')?.value || 1);
    addToCart(state.currentListing, qty);
    closeModal();
  });
  document.getElementById('decreaseQty')?.addEventListener('click', () => bumpQty(-1));
  document.getElementById('increaseQty')?.addEventListener('click', () => bumpQty(1));
  document.getElementById('closeCart')?.addEventListener('click', toggleCart);
  document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
  document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
  document.getElementById('cartItems')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-id]');
    if (!btn) return;
    removeFromCart(btn.dataset.removeId);
  });
  document.getElementById('refreshMarketplaceBtn')?.addEventListener('click', () => {
    loadListings(true);
    loadOrders();
  });
  document.querySelectorAll('#cropDetailModal .close-modal')?.forEach((btn) => btn.addEventListener('click', closeModal));

  // Sell crop modal open/close
  document.getElementById('sellCropBtn')?.addEventListener('click', openSellModal);
  document.querySelectorAll('#sellCropModal .close-modal')?.forEach((btn) => btn.addEventListener('click', closeSellModal));
  document.getElementById('sellCropForm')?.addEventListener('submit', handleSellSubmit);
  document.getElementById('sellFarmSelect')?.addEventListener('change', (e) => loadCropsForFarm(e.target.value));
  document.querySelectorAll('.order-tab')?.forEach((btn) =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.orderTab;
      const sellerPanel = document.getElementById('sellerOrdersList');
      const buyerPanel = document.getElementById('buyerOrdersList');
      if (tab === 'buyer') {
        sellerPanel?.classList.add('hidden');
        buyerPanel?.classList.remove('hidden');
      } else {
        sellerPanel?.classList.remove('hidden');
        buyerPanel?.classList.add('hidden');
      }
    })
  );

  // View toggle (grid/list)
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      const grid = document.getElementById('listingsGrid');
      document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b === btn));
      if (view === 'list') grid?.classList.add('list-view');
      else grid?.classList.remove('list-view');
    });
  });
}

function applyFilters() {
  // Refresh authId in case it was set after initial load (e.g., post-login)
  if (!state.authId) state.authId = getAuthId();
  state.filtered = [...state.listings].filter((l) =>
    (state.showMineOnly && state.authId ? String(l.ownerId) === String(state.authId) : true) &&
    (state.searchTerm ? `${l.cropName} ${l.farmName} ${l.cropType}`.toLowerCase().includes(state.searchTerm) : true)
  );
  state.visible = DEFAULT_VISIBLE_COUNT;
  renderListings();
}

function renderListings() {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;
  if (!state.filtered.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-leaf"></i><h3>No listings</h3></div>`;
    document.getElementById('loadMore')?.classList.add('hidden');
    return;
  }
  const maxItems = Math.min(state.visible, state.filtered.length);
  grid.innerHTML = state.filtered
    .slice(0, maxItems)
    .map(
      (l) => `
      <article class="listing-card">
        <header class="listing-head">
          <div class="listing-icon"><i class="fas fa-seedling"></i></div>
          <div class="listing-title">
            <div class="badge badge-soft">${capitalize(l.cropType)}</div>
            <h3>${l.cropName}</h3>
            <p class="muted">Farm: ${l.farmName}</p>
            <p class="muted">Seller: ${l.sellerName}${state.authId && String(l.ownerId) === String(state.authId) ? ' (You)' : ''}</p>
          </div>
          <div class="listing-meta-chip">
            <i class="fas fa-clock"></i>
            <span>${formatDate(l.listedOn)}</span>
          </div>
        </header>
        <div class="listing-body">
          <div class="stat">
            <p class="stat-label">Price</p>
            <p class="stat-value">${formatCurrency(l.price)}<span class="stat-suffix">/kg</span></p>
          </div>
          <div class="divider"></div>
          <div class="stat">
            <p class="stat-label">Available</p>
            <p class="stat-value">${l.quantity.toLocaleString()}<span class="stat-suffix"> kg</span></p>
          </div>
        </div>
        <footer class="listing-actions">
          <button class="ghost-btn" data-action="view" data-id="${l.id}"><i class="fas fa-eye"></i> Details</button>
          <button class="primary-btn" data-action="cart" data-id="${l.id}" ${state.authId && String(l.ownerId) === String(state.authId) ? 'disabled title="You cannot buy your own listing"' : ''}>
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
        </footer>
      </article>`
    )
    .join('');
  const loadMoreBtn = document.getElementById('loadMore');
  if (loadMoreBtn) {
    if (maxItems < state.filtered.length) loadMoreBtn.classList.remove('hidden');
    else loadMoreBtn.classList.add('hidden');
  }
}

function renderStats() {
  if (!state.authId) state.authId = getAuthId();
  const total = state.listings.length || 0;
  const mine = state.authId ? state.listings.filter((l) => String(l.ownerId) === String(state.authId)).length : 0;
  const openOrders = state.stats?.openOrders ?? 0;
  const supplyCount = (state.supplyItems || []).length || 0;
  const avgPriceText = state.stats?.avgPrice ? `${formatCurrency(state.stats.avgPrice)}/kg` : '—';

  setText('statTotalListings', total || '--');
  setText('statMyListings', mine.toString());
  setText('statOrders', openOrders.toString());
  setText('statSupply', supplyCount.toString());
  setText('statTotalListingsLabel', avgPriceText);

  renderMyActivity();
  renderOrdersPanel();
}

function openModal(listing) {
  state.currentListing = listing;
  const modal = document.getElementById('cropDetailModal');
  if (!modal) return;
  setText('modalCropName', listing.cropName);
  setText('modalPrice', `${formatCurrency(listing.price)}/kg`);
  setText('modalQuantity', `${listing.quantity.toLocaleString()} kg`);
  setText('modalHarvest', listing.harvest ? new Date(listing.harvest).toLocaleDateString() : 'Immediate');
  setText('modalFarmerName', listing.farmName);
  setText('modalFarmerLocation', listing.cropType ? capitalize(listing.cropType) : '—');
  setText('modalTotalPrice', formatCurrency(listing.price));
  const qtyInput = document.getElementById('orderQty');
  if (qtyInput) {
    qtyInput.value = 1;
    qtyInput.max = listing.quantity || 9999;
  }
  modal.classList.add('active');
  modal.style.display = 'flex';
  updateModalPrice();
}

function closeModal() {
  const modal = document.getElementById('cropDetailModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = '';
  state.currentListing = null;
}

function bumpQty(delta) {
  const qtyInput = document.getElementById('orderQty');
  if (!qtyInput) return;
  const max = Number(qtyInput.max || 9999);
  let next = Number(qtyInput.value || 1) + delta;
  if (next < 1) next = 1;
  if (next > max) next = max;
  qtyInput.value = next;
  updateModalPrice();
}

function updateModalPrice() {
  const qtyInput = document.getElementById('orderQty');
  const totalEl = document.getElementById('modalTotalPrice');
  if (!qtyInput || !totalEl || !state.currentListing) return;
  const qty = Number(qtyInput.value || 1);
  const total = qty * (state.currentListing.price || 0);
  totalEl.textContent = formatCurrency(total);
}

async function openSellModal() {
  const modal = document.getElementById('sellCropModal');
  if (!modal) return;
  // Ensure modal is visible even if CSS class is missing
  modal.classList.add('active');
  modal.style.display = 'flex';
  try {
    await populateFarms();
    showNotification('Select a farm to load crops.', 'info');
  } catch (err) {
    console.error('populateFarms failed', err);
    showNotification('Could not load farms. Please refresh.', 'error');
  }
}

function closeSellModal() {
  const modal = document.getElementById('sellCropModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = '';
}

async function populateFarms() {
  const select = document.getElementById('sellFarmSelect');
  if (!select || !window.FarmerAPI?.getFarms) return;
  select.innerHTML = `<option value="">Loading farms...</option>`;
  try {
    const res = await window.FarmerAPI.getFarms(50);
    if (!res?.success) throw new Error(res?.error || 'Unable to load farms');
    const farms = res?.data || [];
    if (!farms.length) {
      select.innerHTML = `<option value="">No farms found</option>`;
      showNotification('No farms found for your account.', 'warning');
      return;
    }
    select.innerHTML = `<option value="">Select a farm</option>` + farms.map((f) => `<option value="${f.farm_id}">${f.farm_name || 'Farm'} (#${f.farm_id})</option>`).join('');
  } catch (err) {
    console.error('getFarms failed', err);
    select.innerHTML = `<option value="">Unable to load farms</option>`;
    showNotification(err.message || 'Unable to load farms. Check login/permissions.', 'error');
  }
}

async function loadCropsForFarm(farmId) {
  const cropSelect = document.getElementById('sellCropSelect');
  if (!cropSelect || !farmId || !window.FarmerAPI?.getCrops) {
    if (cropSelect) cropSelect.innerHTML = `<option value="">Select a field first</option>`;
    return;
  }
  cropSelect.innerHTML = `<option value="">Loading crops...</option>`;
  try {
    const res = await window.FarmerAPI.getCrops(100);
    const crops = (res?.data || []).filter((c) => String(c.farm_id) === String(farmId));
    if (!crops.length) {
      cropSelect.innerHTML = `<option value="">No crops for this field</option>`;
      return;
    }
    cropSelect.innerHTML = `<option value="">Select a crop</option>` + crops.map((c) => `<option value="${c.crop_id}">${c.crop_name || 'Crop'} (#${c.crop_id})</option>`).join('');
  } catch (err) {
    console.error('loadCropsForFarm failed', err);
    cropSelect.innerHTML = `<option value="">Unable to load crops</option>`;
    showNotification('Unable to load crops for that farm.', 'error');
  }
}

async function handleSellSubmit(e) {
  e.preventDefault();
  const farmId = document.getElementById('sellFarmSelect')?.value;
  const cropId = document.getElementById('sellCropSelect')?.value;
  const price = parseFloat(document.getElementById('cropPrice')?.value || '0');
  const qty = parseFloat(document.getElementById('cropQuantity')?.value || '0');
  const harvestDate = document.getElementById('harvestDate')?.value || null;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!farmId || !cropId || !price || !qty) {
    showNotification('Please fill farm, crop, price, and quantity.', 'warning');
    return;
  }
  if (!window.FarmerAPI?.createListing) {
    showNotification('Listing API not available.', 'error');
    return;
  }
  try {
    setLoading(true);
    if (submitBtn) submitBtn.disabled = true;
    const payload = {
      farm_id: Number(farmId),
      crop_id: Number(cropId),
      price_per_unit: price,
      available_qty: qty,
      status: 'active',
      expected_harvest: harvestDate || null
    };
    const res = await window.FarmerAPI.createListing(payload);
    if (res?.success) {
      showNotification('Crop listed successfully.', 'success');
      closeSellModal();
      if (res.data) {
        // Optimistically add to UI if API returns the new row
        state.listings.unshift(normalizeListing(res.data));
        applyFilters();
        renderStats();
      } else {
        loadListings(true);
      }
      e.target.reset();
    } else {
      throw new Error(res?.error || 'Failed to create listing');
    }
  } catch (err) {
    console.error(err);
    showNotification(err.message || 'Failed to list crop.', 'error');
  } finally {
    setLoading(false);
    if (submitBtn) submitBtn.disabled = false;
  }
}

function addToCart(item, qty) {
  const existing = state.cart.find((c) => c.id === item.id && c.type === 'listing');
  if (existing) existing.qty = Math.min(existing.qty + qty, item.quantity || existing.qty + qty);
  else state.cart.push({ id: item.id, name: item.cropName, type: 'listing', price: item.price, unit: 'kg', qty });
  updateCartUI();
  showNotification(`${item.cropName} added to cart.`, 'success');
}

function removeFromCart(id) {
  state.cart = state.cart.filter((c) => String(c.id) !== String(id));
  updateCartUI();
}

function updateCartUI() {
  const itemsEl = document.getElementById('cartItems');
  const countEl = document.querySelector('.cart-count');
  const totalEl = document.querySelector('.total-amount');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const totalItems = state.cart.reduce((sum, c) => sum + c.qty, 0);
  const totalPrice = state.cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  if (countEl) countEl.textContent = totalItems;
  if (totalEl) totalEl.textContent = formatCurrency(totalPrice);
  if (checkoutBtn) checkoutBtn.disabled = !state.cart.length;
  if (!itemsEl) return;
  if (!state.cart.length) {
    itemsEl.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>`;
  } else {
    itemsEl.innerHTML = state.cart
      .map(
        (c) => `
        <div class="cart-item">
          <div>
            <h4>${c.name}</h4>
            <p>${c.qty} ${c.unit}</p>
          </div>
          <div class="cart-item-actions">
            <strong>${formatCurrency(c.price * c.qty)}</strong>
            <button data-remove-id="${c.id}" aria-label="Remove ${c.name}"><i class="fas fa-times"></i></button>
          </div>
        </div>`
      )
      .join('');
  }
  persistCart();
}

function toggleCart() {
  document.getElementById('cartSidebar')?.classList.toggle('active');
}

function handleCheckout() {
  if (!state.cart.length) return;
  const items = state.cart
    .filter((c) => c.type === 'listing')
    .map((c) => ({ listing_id: c.id, quantity: c.qty }));
  if (!items.length) return;

  (async () => {
    try {
      const res = window.FarmerAPI?.createOrder
        ? await window.FarmerAPI.createOrder({ items })
        : { success: false, error: 'Order API unavailable' };
      if (!res.success) throw new Error(res.error || 'Checkout failed');
      showNotification('Order placed successfully.', 'success');
      state.cart = [];
      updateCartUI();
      toggleCart();
    } catch (err) {
      console.error('Checkout failed', err);
      showNotification(err.message || 'Unable to place order.', 'error');
    }
  })();
}

function setLoading(isLoading) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;
  if (isLoading) {
    grid.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <h3>Loading listings</h3>
        <p>Fetching live crops from the marketplace...</p>
      </div>`;
  }
}

function restoreCart() {
  try {
    const raw = sessionStorage.getItem(MARKETPLACE_CART_KEY);
    if (raw) {
      state.cart = JSON.parse(raw);
      updateCartUI();
    }
  } catch (err) {
    console.warn('Restore cart failed', err);
  }
}

function persistCart() {
  try {
    sessionStorage.setItem(MARKETPLACE_CART_KEY, JSON.stringify(state.cart));
  } catch (err) {
    console.warn('Persist cart failed', err);
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(val) || 0);
}
function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function capitalize(val) {
  if (!val) return '';
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function renderMyActivity() {
  const listEl = document.getElementById('myListingsList');
  const countEl = document.getElementById('myListingsCount');
  if (!listEl || !countEl) return;

  if (!state.authId) state.authId = getAuthId();
  const mine = state.authId ? state.listings.filter((l) => String(l.ownerId) === String(state.authId)) : [];

  countEl.textContent = mine.length.toString();

  if (!mine.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-leaf"></i>
        <h3>No listings yet</h3>
        <p>Use "Sell Crop" to create your first offer.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = mine
    .slice(0, 5)
    .map(
      (l) => `
      <div class="panel-row">
        <div>
          <div class="panel-title">${l.cropName}</div>
          <div class="panel-subtitle">${l.farmName || 'Farm'} • ${formatDate(l.listedOn)}</div>
        </div>
        <div class="panel-meta">
          <span>${formatCurrency(l.price)}/kg</span>
          <span>${l.quantity.toLocaleString()} kg</span>
        </div>
      </div>`
    )
    .join('');
}

async function loadOrders() {
  if (!window.FarmerAPI?.getOrders) {
    return; // backend not available
  }
  try {
    const res = await window.FarmerAPI.getOrders(50);
    if (res?.success) {
      // backend may return {sales, purchases} at root or under data
      const payload = res.data ?? res;
      normalizeOrders(payload);
    } else {
      state.orders = { sales: [], purchases: [] };
    }
  } catch (err) {
    console.warn('loadOrders failed', err);
    state.orders = { sales: [], purchases: [] };
  }
  // update openOrders stat: count seller pending
  const pendingSales = (state.orders.sales || []).filter((o) => (o.status || '').toLowerCase() === 'pending').length;
  state.stats.openOrders = pendingSales;
  renderOrdersPanel();
  renderStats();
}

function normalizeOrders(data) {
  if (!data) {
    state.orders = { sales: [], purchases: [] };
    return;
  }
  const authId = getAuthId();
  const lower = (v) => (typeof v === 'string' ? v.toLowerCase() : v);
  const flat = Array.isArray(data) ? data : [];
  const sales = [];
  const purchases = [];

  if (Array.isArray(data.sales) || Array.isArray(data.purchases)) {
    state.orders = {
      sales: (data.sales || []).map(normalizeOrderRow),
      purchases: (data.purchases || []).map(normalizeOrderRow)
    };
    return;
  }

  flat.forEach((row) => {
    const normalized = normalizeOrderRow(row);
    if (normalized.isSale(authId)) sales.push(normalized);
    if (normalized.isPurchase(authId)) purchases.push(normalized);
  });
  state.orders = { sales, purchases };
}

function normalizeOrderRow(row) {
  const listing = row.marketplace_listings || row.listing || {};
  const farm = row.farms || listing.farms || {};
  const crop = row.crops || listing.crops || {};
  return {
    id: row.order_id || row.id,
    listingId: row.listing_id,
    qty: Number(row.quantity ?? 0),
    total: Number(row.total_price ?? 0),
    status: (row.status || 'pending').toLowerCase(),
    orderedOn: row.ordered_on || row.created_at || row.updated_at || null,
    cropName: crop.crop_name || row.crop_name || 'Crop',
    farmName: farm.farm_name || row.farm_name || 'Farm',
    sellerId: row.seller_id || row.owner_id || farm.user_id || listing.farms?.user_id || null,
    buyerId: row.buyer_id || null,
    isSale: (authId) => authId && row.seller_id ? String(row.seller_id) === String(authId) : authId && row.farms?.user_id ? String(row.farms.user_id) === String(authId) : false,
    isPurchase: (authId) => authId && row.buyer_id ? String(row.buyer_id) === String(authId) : false
  };
}

function renderOrdersPanel() {
  const sellerEl = document.getElementById('sellerOrdersList');
  const buyerEl = document.getElementById('buyerOrdersList');
  if (!sellerEl || !buyerEl) return;

  const sales = state.orders.sales || [];
  const purchases = state.orders.purchases || [];

  sellerEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accept-order]');
    if (!btn) return;
    const orderId = btn.dataset.acceptOrder;
    btn.disabled = true;
    try {
      const res = window.FarmerAPI?.updateOrderStatus
        ? await window.FarmerAPI.updateOrderStatus(orderId, 'accepted')
        : { success: false, error: 'Order API unavailable' };
      if (!res.success) throw new Error(res.error || 'Failed to accept');
      showNotification(`Order #${orderId} accepted.`, 'success');
      await loadOrders();
    } catch (err) {
      console.error('Accept order failed', err);
      showNotification(err.message || 'Unable to accept order.', 'error');
      btn.disabled = false;
    }
  }, { once: false });

  sellerEl.innerHTML = sales.length
    ? sales
        .slice(0, 5)
        .map(
          (o) => `
        <div class="panel-row">
          <div>
            <div class="panel-title">${o.cropName}</div>
            <div class="panel-subtitle">${o.farmName || 'Farm'} • ${formatDate(o.orderedOn)}</div>
          </div>
          <div class="panel-meta">
            <span>${o.qty} kg</span>
            <span>${formatCurrency(o.total)}</span>
            <span class="order-status ${o.status}">${capitalize(o.status)}</span>
            ${o.status === 'pending' ? `<button class="primary-btn tiny" data-accept-order="${o.id}">Accept</button>` : ''}
          </div>
        </div>`
        )
        .join('')
    : `<div class="empty-state compact"><p>No sales recorded yet.</p></div>`;

  buyerEl.innerHTML = purchases.length
    ? purchases
        .slice(0, 5)
        .map(
          (o) => `
        <div class="panel-row">
          <div>
            <div class="panel-title">${o.cropName}</div>
            <div class="panel-subtitle">${o.farmName || 'Farm'} • ${formatDate(o.orderedOn)}</div>
          </div>
          <div class="panel-meta">
            <span>${o.qty} kg</span>
            <span>${formatCurrency(o.total)}</span>
            <span class="order-status ${o.status}">${capitalize(o.status)}</span>
          </div>
        </div>`
        )
        .join('')
    : `<div class="empty-state compact"><p>No purchases recorded yet.</p></div>`;
}
function getAuthId() {
  try {
    // Prefer explicit authUserId saved alongside appUserId
    const authUserId = sessionStorage.getItem('authUserId');
    if (authUserId) return authUserId;

    // Fallback to combined currentUser blob
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.authUserId) return parsed.authUserId;
      if (parsed?.id) return parsed.id;
    }
  } catch (_) {
    /* ignore */
  }
  if (window.currentProfile?.user_id) return window.currentProfile.user_id;
  if (window.currentUser?.id) return window.currentUser.id;
  return null;
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>`;
  document.body.appendChild(notification);
  requestAnimationFrame(() => notification.classList.add('show'));
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return 'check-circle';
    case 'warning':
      return 'exclamation-triangle';
    case 'error':
      return 'times-circle';
    default:
      return 'info-circle';
  }
}
function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

const notificationStyles = `
  .notification { position: fixed; top: 20px; right: 20px; background: var(--bg-primary); color: var(--text-primary);
    border-radius: 12px; padding: 15px 20px; box-shadow: 0 12px 30px rgba(0,0,0,0.35);
    border-left: 4px solid #22c55e; transform: translateX(400px); transition: transform 0.3s ease;
    z-index: 1200; max-width: 340px; }
  .notification.show { transform: translateX(0); }
  .notification-warning { border-left-color: #f59e0b; }
  .notification-info { border-left-color: #3b82f6; }
  .notification-error { border-left-color: #ef4444; }
  .notification-content { display: flex; align-items: center; gap: 10px; }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
