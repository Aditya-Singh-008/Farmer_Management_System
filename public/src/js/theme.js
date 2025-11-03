// Simple Theme Toggle System
(function() {
    'use strict';
    
    // Get saved theme preference
    function getSavedTheme() {
        return localStorage.getItem('darkMode') === 'true';
    }
    
    // Save theme preference
    function saveTheme(isDark) {
        localStorage.setItem('darkMode', isDark);
    }
    
    // Apply theme to the page
    function applyTheme(isDark) {
        const body = document.body;
        const html = document.documentElement;
        
        if (isDark) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            html.classList.remove('light-mode');
            html.classList.add('dark-mode');
            html.setAttribute('data-theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            html.classList.remove('dark-mode');
            html.classList.add('light-mode');
            html.setAttribute('data-theme', 'light');
        }
        
        console.log('Theme applied:', isDark ? 'dark' : 'light');
    }
    
    // Update toggle button appearance
    function updateButton(button, isDark) {
        if (!button) return;
        
        const icon = button.querySelector('i');
        const text = button.querySelector('span');
        
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        if (text) {
            text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }
    }
    
    // Toggle theme function
    function toggleTheme() {
        const currentTheme = getSavedTheme();
        const newTheme = !currentTheme;
        
        saveTheme(newTheme);
        applyTheme(newTheme);
        
        // Update all toggle buttons on the page
        const buttons = document.querySelectorAll('#themeToggle, .theme-toggle-btn');
        buttons.forEach(btn => updateButton(btn, newTheme));
        
        return newTheme;
    }
    
    // Attach click handler to button
    function attachThemeToggle(button) {
        if (!button) return;
        
        // Remove any existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add click handler
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Theme toggle button clicked');
            toggleTheme();
        });
        
        console.log('Theme toggle button attached:', newButton);
        return newButton;
    }
    
    // Initialize theme on page load
    function initTheme() {
        const isDark = getSavedTheme();
        applyTheme(isDark);
        
        // Try to find and attach button
        setTimeout(function() {
            const button = document.getElementById('themeToggle');
            if (button) {
                attachThemeToggle(button);
                updateButton(button, isDark);
            }
        }, 100);
    }
    
    // Also listen for sidebar loaded event
    document.addEventListener('sidebarLoaded', function() {
        const isDark = getSavedTheme();
        applyTheme(isDark);
        
        setTimeout(function() {
            const button = document.getElementById('themeToggle');
            if (button) {
                attachThemeToggle(button);
                updateButton(button, isDark);
            }
        }, 100);
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
    
    // Global function for manual toggling
    window.toggleTheme = toggleTheme;
})();

