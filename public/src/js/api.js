// API Utility - Edge Functions Integration
// This file provides helper functions to call Supabase Edge Functions

const BASE = 'https://bmdypirsqwhghrvbhqoy.functions.supabase.co';


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
}

/**
 * Base fetch wrapper that handles Authorization header and 401 errors
 * @param {string} path - API endpoint path (e.g., '/get-profile')
 * @param {object} opts - Fetch options
 * @returns {Promise<object>} - Parsed JSON response or error object
 */
async function fetchJSON(path, opts = {}) {
  const token = sessionStorage.getItem('sessionToken');
  
  // Build full URL
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  
  // Set default headers
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZHlwaXJzcXdoZ2hydmJocW95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgyMTk3NywiZXhwIjoyMDc1Mzk3OTc3fQ.NpfC1SI0-N6g68KoPt9hNhCSK8pCytamQ6khJ7qCYcc',
    ...opts.headers
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
      const user = response.user || response.session.user;
      
      if (token) {
        setAuthToken(token);
      }
      
      if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
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
async function getInventory(limit = 5) {
  const url = `/get-inventory${limit ? `?limit=${limit}` : ''}`;
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
  return newMode === 'on';
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
    getListings,
    searchCropsAndListings,
    isDemoModeOn,
    toggleDemoMode,
    handleApiError,
    showErrorMessage,
    showSuccessMessage
  };
}
