// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    initializeThemeToggle();
});

// Chart initialization
function initializeCharts() {
    // Crop Growth Chart
    const cropGrowthCtx = document.getElementById('cropGrowthChart').getContext('2d');
    const cropGrowthChart = new Chart(cropGrowthCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [
                {
                    label: 'Wheat',
                    data: [15, 25, 40, 55, 70, 80, 85, 90],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Corn',
                    data: [10, 20, 35, 50, 65, 75, 82, 88],
                    borderColor: '#FFC107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Rice',
                    data: [12, 22, 38, 52, 68, 78, 84, 89],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            }
        }
    });

    // Yield Analysis Chart
    const yieldAnalysisCtx = document.getElementById('yieldAnalysisChart').getContext('2d');
    const yieldAnalysisChart = new Chart(yieldAnalysisCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Wheat',
                    data: [320, 450, 380, 510, 620, 580, 720, 680, 750, 820, 780, 850],
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                },
                {
                    label: 'Corn',
                    data: [280, 320, 410, 380, 520, 610, 580, 650, 720, 680, 750, 790],
                    backgroundColor: 'rgba(255, 193, 7, 0.7)',
                    borderColor: '#FFC107',
                    borderWidth: 1
                },
                {
                    label: 'Rice',
                    data: [250, 290, 350, 420, 480, 520, 610, 590, 650, 720, 680, 740],
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    borderColor: '#2196F3',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Yield (kg)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            }
        }
    });

    // Update charts when theme changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                cropGrowthChart.update();
                yieldAnalysisChart.update();
            }
        });
    });
    
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// Theme toggle functionality
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;
    updateThemeIcon(themeIcon, savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.className;
        const newTheme = currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';
        
        document.body.className = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(themeIcon, newTheme);
    });
}

function updateThemeIcon(iconElement, theme) {
    if (theme === 'dark-mode') {
        iconElement.className = 'fas fa-sun';
        iconElement.parentElement.querySelector('.nav-text').textContent = 'Light Mode';
    } else {
        iconElement.className = 'fas fa-moon';
        iconElement.parentElement.querySelector('.nav-text').textContent = 'Dark Mode';
    }
}

// Chart controls functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to chart control buttons
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('click', function() {
            const parent = this.parentElement;
            const siblings = parent.querySelectorAll('.control-btn');
            
            siblings.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Add event listeners to navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (!this.href || this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
});