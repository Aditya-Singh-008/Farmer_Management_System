// Fields Management JavaScript
class FieldsManager {
    constructor() {
        this.fields = [];
        this.tasks = [];
        this.currentUser = null;
        this.weatherChart = null;
        this.growthChart = null;
        this.currentField = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadFieldsData();
        await this.loadTasksData();
        this.initEventListeners();
        this.renderFieldsGrid();
        this.renderTasks();
        this.initThemeToggle();
    }

    async checkAuth() {
        // Simulate auth check - in real app, this would check Supabase
        this.currentUser = { id: 1, name: 'Farmer John' };
    }

    async loadFieldsData() {
        // Sample fields data
        this.fields = [
            {
                id: 1,
                name: 'North Field',
                crop: 'corn',
                cropName: '🌽 Corn',
                soilType: 'Loamy Soil',
                temperature: 28,
                humidity: 65,
                windSpeed: 12,
                rainfall: 5,
                area: 12.5,
                status: 'active'
            },
            {
                id: 2,
                name: 'South Field',
                crop: 'wheat',
                cropName: '🌾 Wheat',
                soilType: 'Sandy Soil',
                temperature: 26,
                humidity: 58,
                windSpeed: 8,
                rainfall: 2,
                area: 8.2,
                status: 'active'
            },
            {
                id: 3,
                name: 'East Field',
                crop: 'tomato',
                cropName: '🍅 Tomato',
                soilType: 'Clay Soil',
                temperature: 30,
                humidity: 62,
                windSpeed: 15,
                rainfall: 8,
                area: 15.0,
                status: 'harvested'
            },
            {
                id: 4,
                name: 'West Field',
                crop: 'apple',
                cropName: '🍎 Apple',
                soilType: 'Loamy Soil',
                temperature: 24,
                humidity: 70,
                windSpeed: 6,
                rainfall: 12,
                area: 6.8,
                status: 'active'
            }
        ];
    }

    async loadTasksData() {
        // Sample tasks data
        this.tasks = [
            {
                id: 1,
                title: 'Watering Schedule',
                field: 'North Field',
                type: 'watering',
                dueDate: '2024-01-15',
                status: 'scheduled',
                icon: '💧'
            },
            {
                id: 2,
                title: 'Fertilizer Application',
                field: 'South Field',
                type: 'fertilizer',
                dueDate: '2024-01-16',
                status: 'pending',
                icon: '🧪'
            },
            {
                id: 3,
                title: 'Plowing',
                field: 'West Field',
                type: 'plowing',
                dueDate: '2024-01-14',
                status: 'done',
                icon: '🚜'
            },
            {
                id: 4,
                title: 'Harvest Corn',
                field: 'North Field',
                type: 'harvesting',
                dueDate: '2024-01-20',
                status: 'scheduled',
                icon: '🌾'
            }
        ];
    }

    initEventListeners() {
        // Field Modal
        document.getElementById('addFieldBtn').addEventListener('click', () => {
            this.openAddFieldModal();
        });

        document.getElementById('closeFieldModal').addEventListener('click', () => {
            this.closeAddFieldModal();
        });

        document.getElementById('cancelField').addEventListener('click', () => {
            this.closeAddFieldModal();
        });

        document.getElementById('addFieldForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddField();
        });

        // Analytics Modal
        document.getElementById('closeAnalyticsModal').addEventListener('click', () => {
            this.closeAnalyticsModal();
        });

        // Task Modal
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openAddTaskModal();
        });

        document.getElementById('closeTaskModal').addEventListener('click', () => {
            this.closeAddTaskModal();
        });

        document.getElementById('cancelTask').addEventListener('click', () => {
            this.closeAddTaskModal();
        });

        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTask();
        });

        // Filters
        document.getElementById('cropFilter').addEventListener('change', () => {
            this.renderFieldsGrid();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderFieldsGrid();
        });

        // Analytics Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAnalyticsTab(e.target);
            });
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAddFieldModal();
                this.closeAnalyticsModal();
                this.closeAddTaskModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddFieldModal();
                this.closeAnalyticsModal();
                this.closeAddTaskModal();
            }
        });

        // Field action buttons (delegated event listeners)
        document.getElementById('fieldsGrid').addEventListener('click', (e) => {
            const analyticsBtn = e.target.closest('.view-analytics-btn');
            const editBtn = e.target.closest('.edit-field-btn');
            const fieldCard = e.target.closest('.field-card');

            if (analyticsBtn && fieldCard) {
                const fieldId = fieldCard.dataset.fieldId;
                this.openAnalyticsModal(fieldId);
            }

            if (editBtn && fieldCard) {
                const fieldId = fieldCard.dataset.fieldId;
                this.editField(fieldId);
            }
        });
    }

    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle.querySelector('i');
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light-mode';
        document.body.className = savedTheme;
        this.updateThemeIcon(themeIcon, savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.className;
            const newTheme = currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';
            
            document.body.className = newTheme;
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(themeIcon, newTheme);
            
            // Update charts if they exist
            if (this.weatherChart) {
                this.weatherChart.destroy();
                this.initWeatherChart();
            }
            if (this.growthChart) {
                this.growthChart.destroy();
                this.initGrowthChart();
            }
        });
    }

    updateThemeIcon(iconElement, theme) {
        if (theme === 'dark-mode') {
            iconElement.className = 'fas fa-sun';
            iconElement.parentElement.querySelector('.nav-text').textContent = 'Light Mode';
        } else {
            iconElement.className = 'fas fa-moon';
            iconElement.parentElement.querySelector('.nav-text').textContent = 'Dark Mode';
        }
    }

    renderFieldsGrid() {
        const fieldsGrid = document.getElementById('fieldsGrid');
        const cropFilter = document.getElementById('cropFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredFields = this.fields;

        if (cropFilter !== 'all') {
            filteredFields = filteredFields.filter(field => field.crop === cropFilter);
        }

        if (statusFilter !== 'all') {
            filteredFields = filteredFields.filter(field => field.status === statusFilter);
        }

        if (filteredFields.length === 0) {
            fieldsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-map" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No fields found</h3>
                    <p style="color: var(--text-secondary);">Try adjusting your filters or add a new field</p>
                </div>
            `;
            return;
        }

        fieldsGrid.innerHTML = filteredFields.map(field => this.createFieldCard(field)).join('');
    }

    createFieldCard(field) {
        const statusClass = `status-${field.status}`;
        
        return `
            <div class="field-card" data-field-id="${field.id}" role="listitem">
                <div class="field-gradient-bar ${field.crop}"></div>
                <div class="field-header">
                    <div class="field-title">
                        <h3>${field.name}</h3>
                        <span class="crop-badge">${field.cropName}</span>
                    </div>
                    <div class="field-actions">
                        <button class="btn-icon view-analytics-btn" aria-label="View analytics for ${field.name}" title="View Analytics">
                            <i class="fas fa-chart-line" aria-hidden="true"></i>
                        </button>
                        <button class="btn-icon edit-field-btn" aria-label="Edit ${field.name}" title="Edit Field">
                            <i class="fas fa-edit" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                
                <div class="field-info">
                    <div class="field-detail">
                        <i class="fas fa-mountain" aria-hidden="true"></i>
                        <span>${field.soilType}</span>
                    </div>
                </div>
                
                <div class="field-weather" aria-label="Weather conditions for ${field.name}">
                    <div class="weather-item">
                        <i class="fas fa-thermometer-half" aria-hidden="true"></i>
                        <span>${field.temperature}°C</span>
                    </div>
                    <div class="weather-item">
                        <i class="fas fa-tint" aria-hidden="true"></i>
                        <span>${field.humidity}%</span>
                    </div>
                    <div class="weather-item">
                        <i class="fas fa-wind" aria-hidden="true"></i>
                        <span>${field.windSpeed} m/s</span>
                    </div>
                    <div class="weather-item">
                        <i class="fas fa-cloud-rain" aria-hidden="true"></i>
                        <span>${field.rainfall} mm</span>
                    </div>
                </div>
                
                <div class="field-footer">
                    <span class="field-status ${statusClass}">
                        ${this.formatStatus(field.status)}
                    </span>
                    <span class="field-area">${field.area} ha</span>
                </div>
            </div>
        `;
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        
        tasksList.innerHTML = this.tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}" role="listitem">
                <div class="task-icon" aria-hidden="true">
                    ${task.icon}
                </div>
                <div class="task-content">
                    <h4 class="task-title">${task.title}</h4>
                    <p class="task-field">${task.field}</p>
                    <div class="task-meta">
                        <span class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                        <span class="task-status ${task.status}">${this.formatTaskStatus(task.status)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatStatus(status) {
        const statusMap = {
            active: 'Active',
            harvested: 'Harvested',
            fallow: 'Fallow'
        };
        return statusMap[status] || status;
    }

    formatTaskStatus(status) {
        const statusMap = {
            scheduled: 'Scheduled',
            pending: 'Pending',
            done: 'Done'
        };
        return statusMap[status] || status;
    }

    openAddFieldModal() {
        const modal = document.getElementById('addFieldModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('fieldName').focus();
        
        // Prevent background scroll
        document.body.style.overflow = 'hidden';
    }

    closeAddFieldModal() {
        const modal = document.getElementById('addFieldModal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.getElementById('addFieldForm').reset();
        
        // Restore background scroll
        document.body.style.overflow = '';
    }

    openAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('taskTitle').focus();
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDueDate').min = today;
        
        document.body.style.overflow = 'hidden';
    }

    closeAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.getElementById('addTaskForm').reset();
        document.body.style.overflow = '';
    }

    openAnalyticsModal(fieldId) {
        const field = this.fields.find(f => f.id == fieldId);
        if (!field) return;

        this.currentField = field;
        const modal = document.getElementById('analyticsModal');
        const title = document.getElementById('analyticsTitle');
        
        title.textContent = `Field Analytics - ${field.name}`;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        this.initAnalyticsCharts();
        document.body.style.overflow = 'hidden';
    }

    closeAnalyticsModal() {
        const modal = document.getElementById('analyticsModal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        this.currentField = null;
        
        // Destroy charts
        if (this.weatherChart) {
            this.weatherChart.destroy();
            this.weatherChart = null;
        }
        if (this.growthChart) {
            this.growthChart.destroy();
            this.growthChart = null;
        }
        
        document.body.style.overflow = '';
    }

    switchAnalyticsTab(button) {
        const tabName = button.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.hidden = true;
        });
        
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        const activeTab = document.getElementById(`${tabName}Tab`);
        activeTab.classList.add('active');
        activeTab.hidden = false;
        
        // Initialize chart if needed
        if (tabName === 'weather' && !this.weatherChart) {
            this.initWeatherChart();
        } else if (tabName === 'growth' && !this.growthChart) {
            this.initGrowthChart();
        }
    }

    initAnalyticsCharts() {
        this.initWeatherChart();
    }

    initWeatherChart() {
        const ctx = document.getElementById('weatherChart').getContext('2d');
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#E2E8F0' : '#1F2937';
        const gridColor = isDark ? '#4A5568' : '#E5E7EB';
        
        this.weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: [26, 28, 30, 29, 27, 25, 24],
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Humidity (%)',
                        data: [60, 65, 62, 58, 55, 70, 68],
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
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: '7-Day Weather Trends',
                        color: textColor
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
    }

    initGrowthChart() {
        const ctx = document.getElementById('growthChart').getContext('2d');
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#E2E8F0' : '#1F2937';
        const gridColor = isDark ? '#4A5568' : '#E5E7EB';
        
        this.growthChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Crop Height (cm)',
                    data: [15, 32, 45, 62, 78, 85],
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: 'Crop Growth Progress',
                        color: textColor
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Height (cm)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
    }

    async handleAddField() {
        const formData = new FormData(document.getElementById('addFieldForm'));
        const fieldData = {
            name: formData.get('fieldName'),
            latitude: formData.get('fieldLatitude'),
            longitude: formData.get('fieldLongitude'),
            area: parseFloat(formData.get('fieldArea')),
            soilType: formData.get('fieldSoilType'),
            cropType: formData.get('fieldCropType')
        };

        // Validate required fields
        if (!fieldData.name || !fieldData.area) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Create new field object
        const newField = {
            id: Date.now(),
            name: fieldData.name,
            crop: fieldData.cropType || 'general',
            cropName: this.getCropEmoji(fieldData.cropType) + ' ' + this.formatCropName(fieldData.cropType),
            soilType: fieldData.soilType ? fieldData.soilType.charAt(0).toUpperCase() + fieldData.soilType.slice(1) + ' Soil' : 'Unknown Soil',
            temperature: Math.floor(Math.random() * 10) + 22,
            humidity: Math.floor(Math.random() * 20) + 50,
            windSpeed: Math.floor(Math.random() * 10) + 5,
            rainfall: Math.floor(Math.random() * 15),
            area: fieldData.area,
            status: 'active'
        };

        // Add to fields array
        this.fields.unshift(newField);
        
        // Update UI
        this.renderFieldsGrid();
        this.closeAddFieldModal();
        
        this.showNotification('Field added successfully!', 'success');
    }

    async handleAddTask() {
        const formData = new FormData(document.getElementById('addTaskForm'));
        const taskData = {
            title: formData.get('taskTitle'),
            field: formData.get('taskField'),
            type: formData.get('taskType'),
            dueDate: formData.get('taskDueDate'),
            priority: formData.get('taskPriority')
        };

        // Validate required fields
        if (!taskData.title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        // Create new task object
        const newTask = {
            id: Date.now(),
            title: taskData.title,
            field: taskData.field || 'General',
            type: taskData.type,
            icon: this.getTaskIcon(taskData.type),
            dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
            status: 'scheduled'
        };

        // Add to tasks array
        this.tasks.unshift(newTask);
        this.renderTasks();
        this.closeAddTaskModal();
        
        this.showNotification('Task added successfully!', 'success');
    }

    getCropEmoji(cropType) {
        const emojis = {
            wheat: '🌾',
            corn: '🌽',
            tomato: '🍅',
            apple: '🍎',
            rice: '🍚',
            soybean: '🥜'
        };
        return emojis[cropType] || '🌱';
    }

    getTaskIcon(taskType) {
        const icons = {
            watering: '💧',
            fertilizer: '🧪',
            plowing: '🚜',
            harvesting: '🌾',
            planting: '🌱'
        };
        return icons[taskType] || '📝';
    }

    formatCropName(cropType) {
        return cropType ? cropType.charAt(0).toUpperCase() + cropType.slice(1) : 'General';
    }

    editField(fieldId) {
        const field = this.fields.find(f => f.id == fieldId);
        if (!field) return;

        // For demo purposes, just show a notification
        this.showNotification(`Edit field: ${field.name}`, 'info');
        // In a real implementation, you would open an edit modal with pre-filled data
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-left: 4px solid ${this.getNotificationColor(type)};
            border-radius: 0.5rem;
            padding: 1rem 1.5rem;
            box-shadow: var(--shadow-hover);
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 1001;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem; border-radius: 0.25rem;">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        // Add keyframes for animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            info: '#2196F3',
            warning: '#FF9800'
        };
        return colors[type] || '#2196F3';
    }
}

// Initialize Fields Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FieldsManager();
});