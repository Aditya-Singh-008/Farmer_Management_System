const FIELD_TASKS_STORAGE_KEY = 'smartfarmer_field_tasks';
const DEMO_FIELD_TASKS = [
  { id: 1, title: 'Irrigation Check', field: 'North Field', type: 'watering', dueDate: '2024-02-01', status: 'scheduled', icon: 'fas fa-tint', priority: 'medium' },
  { id: 2, title: 'Fertilizer Application', field: 'South Field', type: 'fertilizer', dueDate: '2024-02-03', status: 'pending', icon: 'fas fa-spray-can', priority: 'high' },
  { id: 3, title: 'Soil Sampling', field: 'East Field', type: 'analysis', dueDate: '2024-02-05', status: 'done', icon: 'fas fa-vials', priority: 'low' }
];

class FieldsDashboard {
  constructor() {
    this.fields = [];
    this.tasks = this.loadStoredTasks();
    this.hasDemoTasks = false;
    if (!this.tasks.length) {
      this.tasks = DEMO_FIELD_TASKS.slice();
      this.hasDemoTasks = true;
    }
    this.weatherChart = null;
    this.init();
  }

  async init() {
    await this.loadFieldsData();
    this.initEventListeners();
    this.renderFieldsGrid();
    this.renderTasks();
  }

  async loadFieldsData() {
    const notice = document.getElementById('demoNotice');
    this.fields = [];
    try {
      if (window.FarmerAPI?.getFarms) {
        const response = await window.FarmerAPI.getFarms(100);
        if (response?.success && Array.isArray(response.data)) {
          this.fields = response.data.map((row) => this.normalizeFarmRow(row));
          notice?.classList.toggle('hidden', this.fields.length > 0);
        } else if (Array.isArray(response?.demo?.farms)) {
          this.fields = response.demo.farms.map((row) => this.normalizeFarmRow(row));
          notice?.classList.remove('hidden');
        }
      }
      if (!this.fields.length && window.supabase?.from) {
        const { data, error } = await window.supabase.from('farms').select('*');
        if (!error && Array.isArray(data)) {
          this.fields = data.map((row) => this.normalizeFarmRow(row));
          notice?.classList.toggle('hidden', this.fields.length > 0);
        }
      }
    } catch (error) {
      console.warn('Unable to load fields', error);
      notice?.classList.remove('hidden');
    }
    this.updateSummaryCards();
    this.populateCropFilterOptions();
    this.populateTaskFieldOptions();
    this.updateFieldsMeta(this.fields.length);
  }

  normalizeFarmRow(row = {}) {
    const cropType = (row.crop_type || '').toString().toLowerCase();
    return {
      id: row.farm_id || row.id || Date.now(),
      name: row.farm_name || 'Untitled field',
      crop: cropType || 'general',
      cropName: this.formatCropName(cropType),
      soilTypeRaw: row.soil_type || null,
      soilType: row.soil_type ? this.formatSoil(row.soil_type) : '°',
      area: typeof row.area === 'number' ? row.area : row.area ? Number(row.area) : null,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      status: row.status || 'active',
      crop_type: row.crop_type || '',
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    };
  }

  formatSoil(value) {
    const text = value?.toString().trim();
    if (!text) return '°';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  updateSummaryCards() {
    const totalFields = this.fields.length;
    const totalArea = this.fields.reduce((sum, field) => sum + (Number(field.area) || 0), 0);
    const soilTypes = new Set(this.fields.map((f) => f.soilTypeRaw).filter(Boolean));
    const cropTypes = new Set(this.fields.map((f) => f.crop).filter((crop) => crop && crop !== 'general'));

    this.setSummaryValue('totalFields', totalFields);
    this.setSummaryBadge('totalFieldsBadge', totalFields ? 'Tracked' : 'No data');
    this.setSummaryValue('soilTypes', soilTypes.size);
    this.setSummaryBadge('soilTypesBadge', soilTypes.size ? 'Unique soils' : 'Add soil data');
    this.setSummaryValue('cropTypes', cropTypes.size);
    this.setSummaryBadge('cropTypesBadge', cropTypes.size ? 'Varieties tracked' : 'Add crops');
    this.setSummaryValue('totalArea', totalArea ? totalArea.toFixed(1) : '0.0');
    this.setSummaryBadge('totalAreaBadge', totalArea ? 'Hectares in use' : 'No area data');
  }

  setSummaryValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  setSummaryBadge(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  initEventListeners() {
    document.querySelectorAll('[data-open-field-modal="true"]').forEach((btn) => {
      btn.addEventListener('click', () => this.openAddFieldModal());
    });
    document.querySelectorAll('[data-open-task-modal="true"]').forEach((btn) => {
      btn.addEventListener('click', () => this.openAddTaskModal());
    });

    document.getElementById('addFieldBtn')?.addEventListener('click', () => this.openAddFieldModal());
    document.getElementById('closeFieldModal')?.addEventListener('click', () => this.closeAddFieldModal());
    document.getElementById('cancelField')?.addEventListener('click', () => this.closeAddFieldModal());
    document.getElementById('addFieldForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddField();
    });

    document.getElementById('addTaskBtn')?.addEventListener('click', () => this.openAddTaskModal());
    document.getElementById('closeTaskModal')?.addEventListener('click', () => this.closeAddTaskModal());
    document.getElementById('cancelTask')?.addEventListener('click', () => this.closeAddTaskModal());
    document.getElementById('addTaskForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    document.getElementById('viewCropsBtn')?.addEventListener('click', () => {
      window.location.href = 'crops.html';
    });

    document.getElementById('closeAnalyticsModal')?.addEventListener('click', () => this.closeAnalyticsModal());

    document.getElementById('cropFilter')?.addEventListener('change', () => this.renderFieldsGrid());
    document.getElementById('statusFilter')?.addEventListener('change', () => this.renderFieldsGrid());

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.switchAnalyticsTab(btn));
    });

    document.addEventListener('click', (event) => {
      if (event.target.classList?.contains('modal')) {
        this.closeAddFieldModal();
        this.closeAddTaskModal();
        this.closeAnalyticsModal();
      }
    });

    document.getElementById('fieldsGrid')?.addEventListener('click', (event) => {
      const analyticsBtn = event.target.closest('.view-analytics-btn');
      const fieldCard = event.target.closest('.field-card');
      if (analyticsBtn && fieldCard) {
        const fieldId = fieldCard.getAttribute('data-field-id');
        this.openAnalyticsModal(fieldId);
      }
    });
  }

  renderFieldsGrid() {
    const fieldsGrid = document.getElementById('fieldsGrid');
    if (!fieldsGrid) return;
    const cropFilter = document.getElementById('cropFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    let filtered = [...this.fields];
    if (cropFilter !== 'all') {
      filtered = filtered.filter((field) => field.crop === cropFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((field) => field.status === statusFilter);
    }

    this.updateFieldsMeta(filtered.length);

    if (!filtered.length) {
      fieldsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <i class="fas fa-map" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No fields found</h3>
          <p style="color: var(--text-secondary);">Try adjusting your filters or add a new field</p>
        </div>`;
      return;
    }

    fieldsGrid.innerHTML = filtered.map((field) => this.createFieldCard(field)).join('');
  }

  createFieldCard(field) {
    return `
      <div class="field-card" data-field-id="${field.id}" role="listitem">
        <div class="field-gradient-bar ${field.crop}"></div>
        <div class="field-header">
          <div class="field-title">
            <h3>${field.name}</h3>
            <span class="crop-badge">${field.cropName}</span>
          </div>
          <div class="field-actions">
            <button class="btn-icon view-analytics-btn" aria-label="View analytics for ${field.name}">
              <i class="fas fa-chart-line" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="field-info">
          <div class="field-detail"><i class="fas fa-seedling"></i><span>${field.cropName || '°'}</span></div>
          <div class="field-detail"><i class="fas fa-mountain"></i><span>${field.soilType}</span></div>
        </div>
        <div class="field-weather">
          <div class="weather-item"><i class="fas fa-map-marker-alt"></i><span>${this.formatCoordinate(field.latitude)}</span></div>
          <div class="weather-item"><i class="fas fa-map-marker-alt"></i><span>${this.formatCoordinate(field.longitude, true)}</span></div>
          <div class="weather-item"><i class="fas fa-ruler-combined"></i><span>${field.area ? `${field.area.toFixed(1)} ha` : '°'}</span></div>
          <div class="weather-item"><i class="fas fa-clock"></i><span>${this.formatDate(field.created_at) || '°'}</span></div>
        </div>
        <div class="field-footer">
          <span class="field-status">${this.formatStatus(field.status)}</span>
          <span class="field-area">${field.area ? `${field.area.toFixed(1)} ha` : ''}</span>
        </div>
      </div>`;
  }

  renderTasks() {
    const container = document.getElementById('tasksList');
    if (!container) return;
    if (!this.tasks.length) {
      container.innerHTML = '<p class="empty-state">No tasks yet</p>';
      this.updateTasksMeta();
      return;
    }
    container.innerHTML = this.tasks
      .map((task) => {
        const priority = task.priority || 'medium';
        const icon = task.icon || this.resolveTaskIcon(task.type);
        return `
          <div class="task-item" data-task-id="${task.id}" role="listitem">
            <div class="task-icon"><i class="${icon}"></i></div>
            <div class="task-content">
              <h4 class="task-title">${task.title}</h4>
              <p class="task-field">${task.field}</p>
              <div class="task-meta">
                <span class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                <span class="task-priority ${priority}">${this.formatPriority(priority)}</span>
                <span class="task-status ${task.status}">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
              </div>
            </div>
          </div>`;
      })
      .join('');
    this.updateTasksMeta();
  }

  openAddFieldModal() {
    const modal = document.getElementById('addFieldModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('addFieldForm')?.reset();
    document.body.style.overflow = 'hidden';
  }

  closeAddFieldModal() {
    const modal = document.getElementById('addFieldModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('addTaskForm')?.reset();
    this.populateTaskFieldOptions();
    document.body.style.overflow = 'hidden';
  }

  closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async handleAddField() {
    const form = document.getElementById('addFieldForm');
    if (!form) return;
    const formData = new FormData(form);
    const payload = {
      farm_name: formData.get('fieldName')?.toString().trim(),
      latitude: formData.get('fieldLatitude') ? Number(formData.get('fieldLatitude')) : null,
      longitude: formData.get('fieldLongitude') ? Number(formData.get('fieldLongitude')) : null,
      area: formData.get('fieldArea') ? Number(formData.get('fieldArea')) : null,
      soil_type: formData.get('fieldSoilType') || null,
      crop_type: formData.get('fieldCropType') || null
    };

    if (!payload.farm_name || !payload.area) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    const authId = await this.resolveAuthUserId();
    if (!authId) {
      this.showNotification('Unable to determine the current user. Please log in again.', 'error');
      return;
    }
    payload.user_id = authId;

    try {
      const { data, error } = await window.supabase.from('farms').insert(payload).select().single();
      if (error) throw error;
      const normalized = this.normalizeFarmRow(data);
      this.fields.unshift(normalized);
      this.updateSummaryCards();
      this.populateTaskFieldOptions();
      this.populateCropFilterOptions();
      this.renderFieldsGrid();
      this.updateFieldsMeta(this.fields.length);
      this.closeAddFieldModal();
      this.showNotification('Field added successfully!', 'success');
    } catch (error) {
      console.error('Failed to add field', error);
      this.showNotification(error.message || 'Unable to save field right now.', 'error');
    }
  }

  async resolveAuthUserId() {
    const stored = sessionStorage.getItem('authUserId');
    if (stored) return stored;
    if (window.supabase?.auth?.getUser) {
      try {
        const { data, error } = await window.supabase.auth.getUser();
        if (!error && data?.user?.id) {
          sessionStorage.setItem('authUserId', data.user.id);
          return data.user.id;
        }
      } catch (error) {
        console.warn('Unable to resolve auth user', error);
      }
    }
    return null;
  }

  async handleAddTask() {
    const form = document.getElementById('addTaskForm');
    if (!form) return;
    const formData = new FormData(form);
    const title = formData.get('taskTitle')?.toString().trim();
    if (!title) {
      this.showNotification('Please enter a task title', 'error');
      return;
    }
    if (this.hasDemoTasks) {
      this.tasks = [];
      this.hasDemoTasks = false;
    }
    const selectedFieldId = formData.get('taskField')?.toString();
    const selectedField = this.fields.find((f) => String(f.id) === selectedFieldId);
    const taskType = formData.get('taskType') || 'general';
    const dueDate = formData.get('taskDueDate') || new Date().toISOString().split('T')[0];
    const priority = formData.get('taskPriority') || 'medium';
    const localTask = {
      id: Date.now(),
      title,
      field: selectedField?.name || 'General',
      fieldId: selectedField?.id || null,
      type: taskType,
      dueDate,
      status: 'scheduled',
      priority,
      icon: this.resolveTaskIcon(taskType)
    };

    // Try backend so it appears on dashboard too
    let created = null;
    if (window.FarmerAPI?.createTask) {
      try {
        const payload = {
          title: localTask.title,
          description: null,
          due_date: localTask.dueDate,
          farm_id: selectedField?.id || null,
          status: localTask.status,
          priority: localTask.priority
        };
        const res = await window.FarmerAPI.createTask(payload);
        if (res?.success && res.data) {
          created = res.data;
        }
      } catch (err) {
        console.warn('createTask from fields failed, using local only', err);
      }
    }

    const normalized = created
      ? {
          id: created.task_id || created.id || Date.now(),
          title: created.title || localTask.title,
          field: selectedField?.name || created.field || 'General',
          fieldId: selectedField?.id || null,
          type: localTask.type,
          dueDate: created.due_date || localTask.dueDate,
          status: created.status || localTask.status,
          priority: created.priority || localTask.priority,
          icon: localTask.icon
        }
      : localTask;

    this.tasks.unshift(normalized);
    this.saveTasks();
    this.renderTasks();
    this.closeAddTaskModal();
    this.showNotification('Task added successfully!', 'success');
  }

  openAnalyticsModal(fieldId) {
    const field = this.fields.find((f) => String(f.id) === String(fieldId));
    if (!field) return;
    this.currentField = field;
    const modal = document.getElementById('analyticsModal');
    const title = document.getElementById('analyticsTitle');
    if (title) title.textContent = `Field Analytics - ${field.name}`;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    this.initWeatherChart();
    document.body.style.overflow = 'hidden';
  }

  closeAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    this.currentField = null;
    if (this.weatherChart) {
      this.weatherChart.destroy();
      this.weatherChart = null;
    }
    document.body.style.overflow = '';
  }

  switchAnalyticsTab(button) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach((tab) => {
      tab.classList.remove('active');
      tab.hidden = true;
    });
    button.classList.add('active');
    const tabName = button.dataset.tab;
    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.hidden = false;
    }
    if (tabName === 'weather') {
      this.initWeatherChart();
    }
  }

  initWeatherChart() {
    const ctx = document.getElementById('weatherChart')?.getContext('2d');
    if (!ctx) return;
    if (this.weatherChart) {
      this.weatherChart.destroy();
    }
    const base = (Number(this.currentField?.area) || 10) % 5;
    const temps = Array.from({ length: 7 }, (_, idx) => base + 24 + Math.sin(idx) * 2);
    const humidity = temps.map((t) => 65 - (t % 5));
    this.weatherChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temps,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Humidity (%)',
            data: humidity,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  formatStatus(status) {
    const map = {
      active: 'Active',
      harvested: 'Harvested',
      fallow: 'Fallow'
    };
    return map[status] || 'Active';
  }

  formatCropName(crop) {
    if (!crop || crop === 'general') return 'General';
    return crop.charAt(0).toUpperCase() + crop.slice(1);
  }

  formatCoordinate(value, isLng = false) {
    if (value == null || Number.isNaN(value)) return '°';
    const suffix = isLng ? (value >= 0 ? 'E' : 'W') : value >= 0 ? 'N' : 'S';
    return `${Math.abs(value).toFixed(3)}° ${suffix}`;
  }

  formatDate(dateValue) {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  }

  showNotification(message, type = 'info') {
    document.querySelector('.notification-toast')?.remove();
    const colors = {
      success: '#16a34a',
      error: '#dc2626',
      info: '#2563eb',
      warning: '#f59e0b'
    };
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: var(--bg-primary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-left: 4px solid ${colors[type] || colors.info};
      border-radius: 0.9rem;
      padding: 0.9rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: var(--card-shadow);
      z-index: 1200;
    `;
    toast.innerHTML = `<span>${message}</span><button type="button" aria-label="Close">&times;</button>`;
    const closeBtn = toast.querySelector('button');
    closeBtn.style.cssText = 'background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-secondary);';
    closeBtn.addEventListener('click', () => toast.remove());
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  loadStoredTasks() {
    try {
      const raw = sessionStorage.getItem(FIELD_TASKS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Unable to read stored field tasks', error);
      return [];
    }
  }

  saveTasks() {
    try {
      sessionStorage.setItem(FIELD_TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (error) {
      console.warn('Unable to persist field tasks', error);
    }
  }

  populateTaskFieldOptions() {
    const select = document.getElementById('taskField');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select field</option>';
    this.fields.forEach((field) => {
      const option = document.createElement('option');
      option.value = field.id;
      option.textContent = field.name;
      select.appendChild(option);
    });
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
      select.value = currentValue;
    }
  }

  populateCropFilterOptions() {
    const select = document.getElementById('cropFilter');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="all">All Crops</option>';
    const crops = [...new Set(this.fields.map((field) => field.crop).filter((crop) => crop && crop !== 'general'))];
    crops.forEach((crop) => {
      const option = document.createElement('option');
      option.value = crop;
      option.textContent = this.formatCropName(crop);
      select.appendChild(option);
    });
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
      select.value = currentValue;
    }
  }

  updateFieldsMeta(filteredCount) {
    const meta = document.getElementById('fieldsListMeta');
    if (!meta) return;
    if (!this.fields.length) {
      meta.textContent = 'No fields yet. Add your first field to start tracking.';
      return;
    }
    const total = this.fields.length;
    if (filteredCount === total) {
      meta.textContent = `Showing all ${total} field${total === 1 ? '' : 's'}.`;
    } else {
      meta.textContent = `Showing ${filteredCount} of ${total} fields.`;
    }
  }

  updateTasksMeta() {
    const meta = document.getElementById('tasksMeta');
    if (!meta) return;
    if (!this.tasks.length) {
      meta.textContent = 'No field work scheduled yet.';
      return;
    }
    meta.textContent = `${this.tasks.length} task${this.tasks.length === 1 ? '' : 's'} scheduled.`;
  }

  formatPriority(priority = 'medium') {
    if (!priority) return 'Medium';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  resolveTaskIcon(type) {
    const icons = {
      watering: 'fas fa-tint',
      fertilizer: 'fas fa-spray-can',
      plowing: 'fas fa-tractor',
      harvesting: 'fas fa-wheat-awn',
      analysis: 'fas fa-vials',
      general: 'fas fa-list'
    };
    return icons[type] || icons.general;
  }
}

new FieldsDashboard();





