// main.js — Core initialization for Smart Farmer Dashboard
class SmartFarmerApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = null;
    this.isInitialized = false;
    this.demoNoticeEl = null;
    this.init();
  }

  // 🚀 Entry point
  async init() {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initializeApp());
      } else {
        await this.initializeApp();
      }
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }

  // 🌱 Initialize application logic
  async initializeApp() {
    await this.checkAuthentication();

    // 🚫 Skip sidebar and navbar (no component fetching)
    console.log('Skipping sidebar and navbar loading for signup/login.');

    // Theme initialization now handled by theme.js
    // this.initTheme();
    this.initNavigation();
    this.initEventListeners();
    this.initDemoNotice();
    this.setCurrentPage();

    this.isInitialized = true;

    console.log('%c🌱 Smart Farmer App initialized (no sidebar/navbar)!', 'color: #4CAF50; font-weight: bold;');
  }

  // 🔐 Authentication check and profile loading
  async checkAuthentication() {
    try {
      const currentPage = window.location.pathname.split('/').pop();
      const isAuthPage = currentPage === 'login.html' || currentPage === 'signup.html';
      
      // Check for session token
      const sessionToken = sessionStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        // No token - redirect to login if on protected page
        if (!isAuthPage) {
          console.log('No session token found, redirecting to login...');
          window.location.href = 'login.html';
          return;
        }
        // On auth page, do nothing
        return;
      }

      // Token exists - verify and load profile
      if (window.FarmerAPI && window.FarmerAPI.getProfile) {
        try {
          const profileResponse = await window.FarmerAPI.getProfile();
          
          if (profileResponse.success && profileResponse.data) {
            // Profile loaded successfully
            this.currentUser = profileResponse.data;
            sessionStorage.setItem('currentUser', JSON.stringify(profileResponse.data));
            
            // Update UI with profile data
            this.updateProfileUI(profileResponse.data);
            
            console.log('User authenticated:', profileResponse.data.email);
          } else if (profileResponse.error === 'Unauthorized' || profileResponse.success === false) {
            // 401 or other auth error - clear token and redirect
            console.log('Authentication failed, clearing session...');
            if (window.FarmerAPI.clearAuthToken) {
              window.FarmerAPI.clearAuthToken();
            } else {
              sessionStorage.clear();
            }
            
            if (!isAuthPage) {
              window.location.href = 'login.html';
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // On error, if not on auth page, redirect to login
          if (!isAuthPage) {
            if (window.FarmerAPI && window.FarmerAPI.clearAuthToken) {
              window.FarmerAPI.clearAuthToken();
            }
            window.location.href = 'login.html';
          }
        }
      } else {
        // API not loaded - try to use stored user data
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          try {
            this.currentUser = JSON.parse(storedUser);
            this.updateProfileUI(this.currentUser);
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage !== 'login.html' && currentPage !== 'signup.html') {
        window.location.href = 'login.html';
      }
    }
  }

  // 🎨 Update UI with profile data
  updateProfileUI(profile) {
    try {
      // Update greeting name
      const greetingName = document.querySelector('.greeting h1');
      if (greetingName && profile.first_name) {
        const firstName = profile.first_name;
        const timeOfDay = this.getTimeOfDay();
        greetingName.textContent = `Good ${timeOfDay}, ${firstName}`;
      }

      // Update user name in navbar
      const userNameElements = document.querySelectorAll('.user-name');
      if (userNameElements.length > 0 && profile.first_name && profile.last_name) {
        const fullName = `${profile.first_name} ${profile.last_name}`;
        userNameElements.forEach(el => {
          el.textContent = fullName;
        });
      }

      // Update avatar initials
      const avatarElements = document.querySelectorAll('.avatar');
      if (avatarElements.length > 0 && profile.first_name && profile.last_name) {
        const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
        avatarElements.forEach(el => {
          el.textContent = initials;
        });
      }

      // Update profile picture if available
      if (profile.profile_picture) {
        const avatarImg = document.querySelector('.avatar img');
        if (avatarImg) {
          avatarImg.src = profile.profile_picture;
          avatarImg.style.display = 'block';
        }
      }

      console.log('Profile UI updated:', profile);
    } catch (error) {
      console.error('Error updating profile UI:', error);
    }
  }

  // Get time of day for greeting
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  // 🎨 Theme system
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const themeIcon = themeToggle.querySelector('i');
      this.updateThemeIcon(themeIcon, savedTheme);

      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  toggleTheme() {
    const currentTheme = document.body.className;
    const newTheme = currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const themeIcon = themeToggle.querySelector('i');
      this.updateThemeIcon(themeIcon, newTheme);
    }

    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
  }

  updateThemeIcon(iconElement, theme) {
    if (!iconElement) return;
    if (theme === 'dark-mode') {
      iconElement.className = 'fas fa-sun';
      const text = iconElement.parentElement.querySelector('.nav-text');
      if (text) text.textContent = 'Light Mode';
    } else {
      iconElement.className = 'fas fa-moon';
      const text = iconElement.parentElement.querySelector('.nav-text');
      if (text) text.textContent = 'Dark Mode';
    }
  }

  // 🌍 Basic navigation logic
  initNavigation() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.navigateTo(href);
      }
    });

    window.addEventListener('popstate', (e) => {
      this.handlePopState(e);
    });
  }

  navigateTo(url) {
    window.location.href = url;
  }

  handlePopState() {
    this.setCurrentPage();
  }

  // 🗂️ Page tracking
  setCurrentPage() {
    const path = window.location.pathname;
    this.currentPage = path.split('/').pop() || 'index.html';

    const pageTitles = {
      'index.html': 'Dashboard - Smart Farmer',
      'signup.html': 'Sign Up - Smart Farmer',
      'login.html': 'Login - Smart Farmer',
      'fields.html': 'Fields - Smart Farmer',
      'crops.html': 'Crops - Smart Farmer',
      'weather.html': 'Weather - Smart Farmer',
      'marketplace.html': 'Marketplace - Smart Farmer',
      'reports.html': 'Reports - Smart Farmer',
      'settings.html': 'Settings - Smart Farmer'
    };

    document.title = pageTitles[this.currentPage] || 'Smart Farmer';
  }

  // ⚙️ Event listeners
  initEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }

      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Online/offline handling
    window.addEventListener('online', () => {
      this.showNotification('Connection restored', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNotification('You are currently offline', 'warning');
    });
  }

  initDemoNotice() {
    this.demoNoticeEl = document.getElementById('demoNotice');
    if (!this.demoNoticeEl) return;

    this.updateDemoNotice();

    window.addEventListener('demoModeChange', (event) => {
      this.updateDemoNotice(event.detail);
    });

    window.addEventListener('demoModeFallback', (event) => {
      this.updateDemoNotice(event.detail);
    });
  }

  updateDemoNotice(detail = {}) {
    if (!this.demoNoticeEl) return;

    const shouldShow = this.shouldShowDemoNotice(detail);
    this.demoNoticeEl.classList.toggle('hidden', !shouldShow);

    if (!shouldShow) {
      return;
    }

    const fallbackMessage =
      detail?.reason === 'missing-token'
        ? 'No access token detected. Enable authentication to load live data.'
        : 'Demo data is currently displayed. Connect Supabase for live information.';

    this.demoNoticeEl.textContent = detail?.message || fallbackMessage;
  }

  shouldShowDemoNotice(detail = {}) {
    if (typeof detail.force === 'boolean') {
      return detail.force;
    }

    if (detail.reason) {
      return true;
    }

    if (window.FarmerAPI && typeof window.FarmerAPI.isDemoModeOn === 'function') {
      return window.FarmerAPI.isDemoModeOn();
    }

    return false;
  }

  focusSearch() {
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) searchInput.focus();
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  // 🔔 Notification system
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  // Utility
  isAuthenticated() {
    return !!this.currentUser && !!sessionStorage.getItem('sessionToken');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async updateUserData(userData) {
    console.log('Updating user data:', userData);
  }
}

// 🌾 Initialize the app
const smartFarmerApp = new SmartFarmerApp();
window.smartFarmerApp = smartFarmerApp;

// Export for other modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = smartFarmerApp;
}
