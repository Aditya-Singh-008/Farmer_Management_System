// Utility functions for the Smart Farmer Management System

const Utils = {
    // Format date to readable string
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },

    // Format time
    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format number with commas (for large numbers)
    formatNumber(number) {
        return new Intl.NumberFormat('en-US').format(number);
    },

    // Format area (hectares to other units)
    formatArea(hectares, unit = 'hectares') {
        const conversions = {
            hectares: hectares,
            acres: hectares * 2.47105,
            squareMeters: hectares * 10000
        };

        const value = conversions[unit] || hectares;
        const suffix = {
            hectares: 'ha',
            acres: 'ac',
            squareMeters: 'm²'
        }[unit] || 'ha';

        return `${value.toFixed(2)} ${suffix}`;
    },

    // Format temperature (Celsius to other units)
    formatTemperature(celsius, unit = 'celsius') {
        const conversions = {
            celsius: celsius,
            fahrenheit: (celsius * 9/5) + 32,
            kelvin: celsius + 273.15
        };

        const value = conversions[unit] || celsius;
        const suffix = {
            celsius: '°C',
            fahrenheit: '°F',
            kelvin: 'K'
        }[unit] || '°C';

        return `${Math.round(value)}${suffix}`;
    },

    // Generate random color based on string (for charts)
    generateColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    },

    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate password strength
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            strength: {
                length: password.length >= minLength,
                upperCase: hasUpperCase,
                lowerCase: hasLowerCase,
                numbers: hasNumbers,
                specialChar: hasSpecialChar
            }
        };
    },

    // Calculate crop yield percentage
    calculateYield(actualYield, expectedYield) {
        if (!expectedYield || expectedYield === 0) return 0;
        return Math.round((actualYield / expectedYield) * 100);
    },

    // Get crop growth stage based on days
    getGrowthStage(days, cropType = 'general') {
        const stages = {
            general: [
                { stage: 'Planting', maxDays: 7 },
                { stage: 'Germination', maxDays: 14 },
                { stage: 'Vegetative', maxDays: 45 },
                { stage: 'Flowering', maxDays: 60 },
                { stage: 'Fruiting', maxDays: 90 },
                { stage: 'Harvest', maxDays: Infinity }
            ],
            wheat: [
                { stage: 'Planting', maxDays: 10 },
                { stage: 'Germination', maxDays: 20 },
                { stage: 'Tillering', maxDays: 40 },
                { stage: 'Stem Extension', maxDays: 60 },
                { stage: 'Heading', maxDays: 80 },
                { stage: 'Ripening', maxDays: 120 },
                { stage: 'Harvest', maxDays: Infinity }
            ],
            corn: [
                { stage: 'Planting', maxDays: 7 },
                { stage: 'Emergence', maxDays: 14 },
                { stage: 'Vegetative', maxDays: 50 },
                { stage: 'Tasseling', maxDays: 70 },
                { stage: 'Silking', maxDays: 85 },
                { stage: 'Dough', maxDays: 105 },
                { stage: 'Mature', maxDays: 120 },
                { stage: 'Harvest', maxDays: Infinity }
            ]
        };

        const cropStages = stages[cropType] || stages.general;
        
        for (const stage of cropStages) {
            if (days <= stage.maxDays) {
                return {
                    stage: stage.stage,
                    progress: Math.min((days / stage.maxDays) * 100, 100)
                };
            }
        }

        return { stage: 'Harvest', progress: 100 };
    },

    // Get weather condition icon
    getWeatherIcon(condition) {
        const icons = {
            sunny: '☀️',
            cloudy: '☁️',
            rainy: '🌧️',
            snowy: '❄️',
            stormy: '⛈️',
            windy: '💨',
            foggy: '🌫️',
            partly_cloudy: '⛅'
        };
        return icons[condition] || '🌤️';
    },

    // Calculate soil moisture status
    getSoilMoistureStatus(moisture) {
        if (moisture < 20) return { status: 'Dry', color: '#EF4444' };
        if (moisture < 40) return { status: 'Low', color: '#F59E0B' };
        if (moisture < 70) return { status: 'Optimal', color: '#10B981' };
        if (moisture < 85) return { status: 'High', color: '#3B82F6' };
        return { status: 'Saturated', color: '#6366F1' };
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Get current season based on date
    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'Spring';
        if (month >= 6 && month <= 8) return 'Summer';
        if (month >= 9 && month <= 11) return 'Autumn';
        return 'Winter';
    },

    // Calculate days between two dates
    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    },

    // Check if date is today
    isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    },

    // Check if date is in the past
    isPast(date) {
        return new Date(date) < new Date();
    },

    // Check if date is in the future
    isFuture(date) {
        return new Date(date) > new Date();
    },

    // Sort array by property
    sortByProperty(array, property, ascending = true) {
        return array.sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
    },

    // Filter array by multiple criteria
    filterArray(array, filters) {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === '' || value === null || value === undefined) return true;
                if (typeof value === 'string') {
                    return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
                }
                return item[key] === value;
            });
        });
    },

    // Group array by property
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    },

    // Calculate statistics
    calculateStats(array, property) {
        const values = array.map(item => item[property]).filter(val => !isNaN(val));
        if (values.length === 0) return null;

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        return {
            sum,
            average: avg,
            max,
            min,
            count: values.length
        };
    },

    // Export data as CSV
    exportToCSV(data, filename = 'data.csv') {
        if (!data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
};
// Console styling for development
// Make utils available globally
window.Utils = Utils;

// Console styling for development (browser-safe)
if (window.location.hostname === 'localhost') {
    console.log('%c🔧 Utils loaded successfully!', 'color: #4CAF50; font-weight: bold;');
}

// Theme management utility
class ThemeManager {
    constructor() {
        this.currentTheme = this.getSavedTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.getSavedTheme() === 'system') {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    getSavedTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        
        // Remove existing theme attributes
        document.body.removeAttribute('data-theme');
        document.documentElement.classList.remove('light-mode', 'dark-mode');
        
        // Apply new theme
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark-mode');
        } else {
            document.body.setAttribute('data-theme', 'light');
            document.documentElement.classList.add('light-mode');
        }
        
        this.saveTheme(theme);
        this.updateThemeToggle();
        this.dispatchThemeChangeEvent();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    updateThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('.nav-text');

        if (this.currentTheme === 'dark') {
            if (icon) icon.className = 'fas fa-sun';
            if (text) text.textContent = 'Light Mode';
        } else {
            if (icon) icon.className = 'fas fa-moon';
            if (text) text.textContent = 'Dark Mode';
        }
    }

    dispatchThemeChangeEvent() {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        });
        window.dispatchEvent(event);
    }

    // Method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Method to set theme programmatically
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.applyTheme(theme);
        }
    }
}

// Theme manager initialization disabled - using theme.js instead
// document.addEventListener('DOMContentLoaded', () => {
//     window.themeManager = new ThemeManager();
// });

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}