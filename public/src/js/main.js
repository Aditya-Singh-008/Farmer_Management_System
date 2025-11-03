// main.js — Core initialization for Smart Farmer Dashboard (Signup/Login edition)

class SmartFarmerApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = null;
    this.isInitialized = false;

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
    this.setCurrentPage();

    this.isInitialized = true;

    console.log('%c🌱 Smart Farmer App initialized (no sidebar/navbar)!', 'color: #4CAF50; font-weight: bold;');
  }

  // 🔐 Authentication check (for future use)
  async checkAuthentication() {
    try {
      if (window.SupabaseService && window.SupabaseService.auth) {
        const { isAuthenticated, user } = await window.SupabaseService.auth.isAuthenticated();

        if (isAuthenticated) {
          this.currentUser = user;
          console.log('User authenticated:', user.email);
        } else {
          const currentPage = window.location.pathname.split('/').pop();
          if (currentPage !== 'login.html' && currentPage !== 'signup.html') {
            window.location.href = 'login.html';
            return;
          }
        }
      } else {
        // LocalStorage fallback
        const demoUser = localStorage.getItem('currentUser');
        if (demoUser) {
          this.currentUser = JSON.parse(demoUser);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
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
    return !!this.currentUser;
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
