// src/js/sidebar.js
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('mainSidebar');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.currentPage = this.getCurrentPage();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setActiveNavItem();
        this.handleResponsive();
    }
    
    setupEventListeners() {
        // Theme toggle is now handled by theme.js
        
        // Close sidebar when clicking on overlay (mobile)
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeSidebar());
        }
        
        // Close sidebar when clicking on nav links on mobile
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResponsive());
    }
    
    // Theme is now handled by theme.js
    
    toggleSidebar() {
        // Only for mobile
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('active');
            if (this.overlay) {
                this.overlay.classList.toggle('active');
            }
        }
    }
    
    closeSidebar() {
        this.sidebar.classList.remove('active');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        if (page.includes('crops')) return 'crops';
        if (page.includes('fields')) return 'fields';
        if (page.includes('marketplace')) return 'marketplace';
        if (page.includes('inventory')) return 'inventory';
        if (page.includes('report')) return 'report';
        return 'dashboard';
    }
    
    setActiveNavItem() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === this.currentPage) {
                link.classList.add('active');
            }
        });
    }
    
    handleResponsive() {
        if (window.innerWidth <= 768) {
            this.closeSidebar();
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});

// Also initialize when sidebar is loaded dynamically
if (typeof loadSidebar === 'function') {
    document.addEventListener('sidebarLoaded', () => {
        new SidebarManager();
    });
}