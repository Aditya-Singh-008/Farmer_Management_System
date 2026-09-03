const BASE = import.meta.env.VITE_EDGE_BASE_URL || 'https://utrqtyocuziqsxwborup.functions.supabase.co'

function getToken() {
  return localStorage.getItem('sfms_token') || sessionStorage.getItem('sfms_token')
}

async function fetchJSON(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  return data
}

const api = {
  // Auth
  login: (email, password) =>
    fetchJSON('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  signup: (first_name, last_name, email, password) =>
    fetchJSON('/create-user', { method: 'POST', body: JSON.stringify({ first_name, last_name, email, password }) }),

  // Dashboard
  getDashboard: (limit = 5) => fetchJSON(`/get-dashboard?limit=${limit}`),

  // Farms
  getFarms: (limit = 20) => fetchJSON(`/get-farms?limit=${limit}`),

  // Crops
  getCrops: (limit = 50) => fetchJSON(`/get-crops?limit=${limit}`),

  // Inventory
  getInventory: (limit = 100) => fetchJSON(`/get-inventory?limit=${limit}`),
  createInventory: (payload) =>
    fetchJSON('/create-inventory', { method: 'POST', body: JSON.stringify(payload) }),
  adjustInventory: (payload) =>
    fetchJSON('/adjust-inventory', { method: 'POST', body: JSON.stringify(payload) }),

  // Marketplace
  getListings: (limit = 50) => fetchJSON(`/get-listings?limit=${limit}`),
  createListing: (payload) =>
    fetchJSON('/create-listings', { method: 'POST', body: JSON.stringify(payload) }),

  // Orders
  getOrders: () => fetchJSON('/get-orders'),
  createOrder: (payload) =>
    fetchJSON('/create-order', { method: 'POST', body: JSON.stringify(payload) }),
  updateOrderStatus: (order_id, status) =>
    fetchJSON('/update-order-status', { method: 'POST', body: JSON.stringify({ order_id, status }) }),

  // Profile
  getProfile: () => fetchJSON('/get-profile'),

  // Tasks
  getTasks: () => fetchJSON('/tasks'),
  createTask: (payload) =>
    fetchJSON('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTask: (payload) =>
    fetchJSON('/tasks', { method: 'PUT', body: JSON.stringify(payload) }),

  // Search
  search: (query) => fetchJSON(`/search?q=${encodeURIComponent(query)}`),

  // AI
  aiChat: (payload) =>
    fetchJSON('/ai-chat', { method: 'POST', body: JSON.stringify(payload) }),
  aiYield: (payload) =>
    fetchJSON('/ai-yield', { method: 'POST', body: JSON.stringify(payload) }),
  aiInventoryCheck: () => fetchJSON('/ai-inventory-check'),
}

export default api
