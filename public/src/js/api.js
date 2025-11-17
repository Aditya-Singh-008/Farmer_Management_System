// API Utility - Edge Functions Integration
// This file provides helper functions to call Supabase Edge Functions

// Prefer runtime-injected base (window.__ENV.EDGE_FUNCTION_BASE_URL) where available.
const BASE =
  (window.__ENV && window.__ENV.EDGE_FUNCTION_BASE_URL) ||
  'https://bmdypirsqwhghrvbhqoy.functions.supabase.co';

const SERVICE_ROLE_TOKEN =
  (window.__ENV &&
    (window.__ENV.SERVICE_ROLE_TOKEN || window.__ENV.PUBLIC_SERVICE_ROLE_TOKEN)) ||
  window.__SUPABASE_SERVICE_TOKEN__ ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZHlwaXJzcXdoZ2hydmJocW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MjE5NzcsImV4cCI6MjA3NTM5Nzk3N30.2Mea6l7pn1l-qw28Nxk_m2weMajWlbca0M-ZybMs2xg';

/**
 * Resolve the session token without ever shipping privileged keys in the bundle.
 */
function getSessionToken() {
  return (
    sessionStorage.getItem('sessionToken') ||
    localStorage.getItem('sessionToken') ||
    window.__SUPABASE_ACCESS_TOKEN__ ||
    ''
  );
}

function emitDemoModeEvent(eventName, detail = {}) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch (err) {
    console.warn('[FarmerAPI] Failed to emit event', eventName, err);
  }
}


/**
 * Set authentication token in sessionStorage
 * @param {string} token - JWT access token
 */
function setAuthToken(token) {
  if (token) {
    sessionStorage.setItem('sessionToken', token);
    sessionStorage.setItem('isLoggedIn', 'true');
  }
}

/**
 * Clear authentication token and user data from sessionStorage
 */
function clearAuthToken() {
  sessionStorage.removeItem('sessionToken');
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('authUserId');
  sessionStorage.removeItem('appUserId');
}

/**
 * Base fetch wrapper that handles Authorization header and 401 errors
 * @param {string} path - API endpoint path (e.g., '/get-profile')
 * @param {object} opts - Fetch options
 * @returns {Promise<object>} - Parsed JSON response or error object
 */
async function fetchJSON(path, opts = {}) {
  const token = getSessionToken();
  const requestToken = token || getServiceTokenForPath(path);
  
  // Build full URL
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  
  // Set default headers
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  
  // Add Authorization header if token exists
  if (requestToken) {
    headers.Authorization = `Bearer ${requestToken}`;
  } else if (!path.includes('login') && !path.includes('signup')) {
    console.warn(
      '[FarmerAPI] Missing session token; Edge Function call will require a proxy or injected token.',
      path
    );
    emitDemoModeEvent('demoModeFallback', { reason: 'missing-token', path });
  }
  
  // Merge options
  const fetchOpts = {
    ...opts,
    headers
  };
  
  try {
    const response = await fetch(url, fetchOpts);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      clearAuthToken();
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage !== 'login.html' && currentPage !== 'signup.html') {
        window.location.href = 'login.html';
      }
      return { success: false, error: 'Unauthorized' };
    }
    
    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return { success: false, error: 'Invalid response from server' };
    }
    
    // Return normalized response
    if (!response.ok) {
      return { success: false, error: data.error || data.message || 'Request failed' };
    }
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    emitDemoModeEvent('demoModeFallback', { reason: 'network-error', path, error: error?.message });
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} - Response with success, user, session, or error
 */
async function login(email, password) {
  try {
    const response = await fetchJSON('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Handle success
    if (response.success && response.session) {
      const token = response.session.access_token || response.session?.access_token || response.token;
      const authUser = response.session?.user;
      const user = authUser || response.user;
      
      if (token) {
        setAuthToken(token);
      }
      
      if (authUser) {
        sessionStorage.setItem('currentUser', JSON.stringify(authUser));
      } else if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
      }

      const authId = authUser?.id || response.user?.auth_user_id || null;
      if (authId) {
        sessionStorage.setItem('authUserId', authId);
      }

      const appUserId =
        response.user?.user_id ||
        (response.user?.auth_user_id && response.user?.id && response.user.id !== response.user.auth_user_id
          ? response.user.id
          : null);

      if (appUserId) {
        sessionStorage.setItem('appUserId', appUserId);
      }
      
      return { success: true, user, session: response.session };
    }
    
    // Handle error
    return { success: false, error: response.error || response.message || 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Get user profile
 * @returns {Promise<object>} - Profile data or error
 */
async function getProfile() {
  return await fetchJSON('/get-profile');
}

/**
 * Get dashboard data
 * @param {number} limit - Limit for recent items (default: 5)
 * @returns {Promise<object>} - Dashboard data or error
 */
async function getDashboard(limit = 5) {
  const url = `/get-dashboard${limit ? `?limit=${limit}` : ''}`;
  return await fetchJSON(url);
}

/**
 * Get farms for current user
 * @param {number} limit - Limit for results (default: 5)
 * @returns {Promise<object>} - Farms data or error
 */
async function getFarms(limit = 5) {
  const url = `/get-farms${limit ? `?limit=${limit}` : ''}`;
  return await fetchJSON(url);
}

/**
 * Get crops for current user
 * @param {number} limit - Limit for results (default: 5)
 * @returns {Promise<object>} - Crops data or error
 */
async function getCrops(limit = 5) {
  const url = `/get-crops${limit ? `?limit=${limit}` : ''}`;
  return await fetchJSON(url);
}

/**
 * Get inventory for current user
 * @param {number} limit - Limit for results (default: 5)
 * @returns {Promise<object>} - Inventory data or error
 */
async function getInventory(limit = 50) {
  const url = `/get-inventory${limit ? `?limit=${limit}` : ''}`;
  return await fetchJSON(url);
}

// Create inventory item
async function createInventory(payload) {
  return await fetchJSON('/create-inventory', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Adjust inventory quantity
 * @param {object} payload - { inventory_id, adjustment_type, quantity, reason, notes }
 */
async function adjustInventory(payload) {
  const url = '/adjust-inventory';
  return await fetchJSON(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Create marketplace order(s) from cart items
 * @param {{items: Array<{listing_id:number, quantity:number}>}} payload
 */
async function createOrder(payload) {
  const url = '/create-order';
  return await fetchJSON(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function updateOrderStatus(order_id, status) {
  return await fetchJSON('/update-order-status', {
    method: 'POST',
    body: JSON.stringify({ order_id, status })
  });
}

/**
 * Fetch orders (sales and purchases) for current user.
 * Expects backend /get-orders to return { sales: [], purchases: [] } or a flat array with buyer/seller info.
 */
async function getOrders(limit = 50) {
  const url = `/get-orders${limit ? `?limit=${limit}` : ''}`;
  return await fetchJSON(url);
}

/**
 * Get marketplace listings
 * @param {number} limit - Limit for results (default: 5)
 * @returns {Promise<object>} - Listings data or error
 */
async function getListings(limit = 5) {
  const url = `/get-listings${limit ? `?limit=${limit}` : ''}`;
  return await fetchJSON(url);
}

/**
 * Create a new marketplace listing
 * @param {object} payload - Listing payload
 * @returns {Promise<object>} - API response
 */
async function createListing(payload) {
  const url = '/create-listings';
  return await fetchJSON(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Search crops and listings
 * @param {string} query - Search query
 * @param {number} limit - Limit for results (default: 20)
 * @returns {Promise<object>} - Search results or error
 */
async function searchCropsAndListings(query, limit = 20) {
  if (!query || query.trim().length === 0) {
    return { success: false, error: 'Search query is required' };
  }
  const url = `/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
  return await fetchJSON(url);
}

/**
 * Check if demo mode is enabled
 * @returns {boolean} - True if demo mode is ON
 */
function isDemoModeOn() {
  return localStorage.getItem('demoMode') === 'on';
}

/**
 * Toggle demo mode
 * @returns {boolean} - New demo mode state
 */
function toggleDemoMode() {
  const currentMode = localStorage.getItem('demoMode');
  const newMode = currentMode === 'on' ? 'off' : 'on';
  localStorage.setItem('demoMode', newMode);
  emitDemoModeEvent('demoModeChange', { enabled: newMode === 'on', force: newMode === 'on' });
  return newMode === 'on';
}

function getServiceTokenForPath(path = '') {
  if (!SERVICE_ROLE_TOKEN) return '';
  const normalized = path.toLowerCase();
  const publicEndpoints = ['/login', '/signup', '/create-user', '/forgot-password'];
  return publicEndpoints.some((endpoint) => normalized.includes(endpoint))
    ? SERVICE_ROLE_TOKEN
    : '';
}

async function resolveUserId(preferredId) {
  if (preferredId) return preferredId;

  const rememberAppId = (value) => {
    if (value) {
      sessionStorage.setItem('appUserId', value);
    }
    return value;
  };

  const storedAppId = sessionStorage.getItem('appUserId');
  if (storedAppId) return storedAppId;

  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.user_id) return rememberAppId(parsed.user_id);
      if (parsed?.user?.user_id) return rememberAppId(parsed.user.user_id);
      if (parsed?.user?.id && parsed?.user?.auth_user_id && parsed.user.id !== parsed.user.auth_user_id) {
        return rememberAppId(parsed.user.id);
      }
      if (parsed?.id && parsed?.auth_user_id && parsed.id !== parsed.auth_user_id) {
        return rememberAppId(parsed.id);
      }
    } catch (err) {
      console.warn('Failed to parse stored user', err);
    }
  }

  if (window.currentProfile?.user_id) {
    return rememberAppId(window.currentProfile.user_id);
  }

  const storedAuthId = sessionStorage.getItem('authUserId');
  if (storedAuthId) return storedAuthId;

  if (window.currentProfile?.auth_user_id) {
    return window.currentProfile.auth_user_id;
  }

  if (window.supabase?.auth?.getUser) {
    try {
      const { data, error } = await window.supabase.auth.getUser();
      if (!error && data?.user?.id) {
        sessionStorage.setItem('authUserId', data.user.id);
        return data.user.id;
      }
    } catch (err) {
      console.warn('Unable to fetch Supabase user', err);
    }
  }

  return null;
}

async function resolveAuthUserId(preferredAuthId) {
  if (preferredAuthId) {
    sessionStorage.setItem('authUserId', preferredAuthId);
    return preferredAuthId;
  }

  const storedAuthId = sessionStorage.getItem('authUserId');
  if (storedAuthId) return storedAuthId;

  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.auth_user_id) {
        sessionStorage.setItem('authUserId', parsed.auth_user_id);
        return parsed.auth_user_id;
      }
      if (parsed?.user?.auth_user_id) {
        sessionStorage.setItem('authUserId', parsed.user.auth_user_id);
        return parsed.user.auth_user_id;
      }
      if (parsed?.user?.id) {
        sessionStorage.setItem('authUserId', parsed.user.id);
        return parsed.user.id;
      }
      if (parsed?.id) {
        sessionStorage.setItem('authUserId', parsed.id);
        return parsed.id;
      }
    } catch (err) {
      console.warn('Failed to parse stored user for auth id', err);
    }
  }

  if (window.currentProfile?.auth_user_id) {
    sessionStorage.setItem('authUserId', window.currentProfile.auth_user_id);
    return window.currentProfile.auth_user_id;
  }

  if (window.supabase?.auth?.getUser) {
    try {
      const { data, error } = await window.supabase.auth.getUser();
      if (!error && data?.user?.id) {
        sessionStorage.setItem('authUserId', data.user.id);
        return data.user.id;
      }
    } catch (err) {
      console.warn('Unable to fetch Supabase user for auth id', err);
    }
  }

  return null;
}

function sanitizeProfilePayload(payload = {}) {
  const sanitized = { ...payload };
  const nullableFields = [
    'phone_number',
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
    'dob',
    'gender',
    'profile_picture'
  ];

  nullableFields.forEach((key) => {
    if (sanitized[key] === '') sanitized[key] = null;
  });

  if (!sanitized.dob) sanitized.dob = null;

  if (sanitized.profile_id) {
    sanitized.profile_id = Number(sanitized.profile_id);
  } else {
    delete sanitized.profile_id;
  }

  delete sanitized.auth_user_id;
  delete sanitized.app_user_id;

  const lengthLimits = {
    phone_number: 15,
    postal_code: 15
  };

  Object.entries(lengthLimits).forEach(([field, limit]) => {
    if (typeof sanitized[field] === 'string' && sanitized[field].length > limit) {
      sanitized[field] = sanitized[field].slice(0, limit);
    }
  });

  if (sanitized.gender) {
    const normalized = sanitized.gender
      .toString()
      .trim()
      .toLowerCase();

    const titleCase = normalized
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    sanitized.gender = titleCase || null;
  }

  return sanitized;
}

function shouldSkipAuthColumn(errorMessage = '') {
  if (!errorMessage) return false;
  return (
    /column\s+"auth_user_id"\s+does not exist/i.test(errorMessage) ||
    /could not find the 'auth_user_id' column/i.test(errorMessage)
  );
}

async function saveProfileDetails(payload = {}) {
  if (!window.supabase || typeof window.supabase.from !== 'function') {
    return { success: false, error: 'Supabase client not available. Please refresh the page.' };
  }

  const appUserId = await resolveUserId(payload.app_user_id || null);
  const authUserId = await resolveAuthUserId(payload.user_id || payload.auth_user_id);
  console.log('[saveProfileDetails] resolved app user id', appUserId, 'auth id', authUserId);
  if (!appUserId && !authUserId) {
    return { success: false, error: 'Unable to determine the current user. Please log in again.' };
  }

  const resolvedId = authUserId || appUserId;
  if (authUserId) {
    sessionStorage.setItem('authUserId', authUserId);
  }
  if (appUserId) {
    sessionStorage.setItem('appUserId', appUserId);
  }
  if (!resolvedId) {
    return { success: false, error: 'Unable to determine the current user. Please log in again.' };
  }

  const sanitized = sanitizeProfilePayload({ ...payload, user_id: resolvedId });

  try {
    const { data: existing, error: lookupError } = await window.supabase
      .from('user_profile')
      .select('profile_id')
      .eq('user_id', resolvedId)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      throw lookupError;
    }

    let result;
    if (existing?.profile_id) {
      result = await window.supabase
        .from('user_profile')
        .update(sanitized)
        .eq('profile_id', existing.profile_id)
        .select()
        .single();
    } else {
      result = await window.supabase.from('user_profile').insert(sanitized).select().single();
    }

    if (result.error) {
      throw result.error;
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('saveProfileDetails error', error);
    if (error?.code === '22001') {
      return {
        success: false,
        error: 'Phone number or postal code is too long. Please limit each to 15 characters.'
      };
    }
    return { success: false, error: error.message || 'Failed to save profile.' };
  }
}

/**
 * Handle API error and show message to user
 * @param {object} error - Error object
 * @param {object} response - Response object (optional)
 */
function handleApiError(error, response = null) {
  if (response?.status === 401) {
    clearAuthToken();
    window.location.href = 'login.html';
    return;
  }
  
  const errorMessage = error?.message || error?.error || 'An error occurred';
  showErrorMessage(errorMessage);
}

/**
 * Show error message to user
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
  // Remove existing error messages
  const existing = document.querySelector('.error-message');
  if (existing) {
    existing.remove();
  }
  
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(errorDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

/**
 * Show success message to user
 * @param {string} message - Success message
 */
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    background: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.remove();
    }
  }, 3000);
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.FarmerAPI = {
    setAuthToken,
    clearAuthToken,
    fetchJSON,
    login,
    getProfile,
    getDashboard,
    getFarms,
  getCrops,
  getInventory,
  createInventory,
  adjustInventory,
  getListings,
  createListing,
  searchCropsAndListings,
  // Orders
  createOrder,
  getOrders,
  updateOrderStatus,
  isDemoModeOn,
  toggleDemoMode,
  saveProfileDetails,
  handleApiError,
  showErrorMessage,
    showSuccessMessage
  };
}
