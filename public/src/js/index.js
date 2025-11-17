// Theme toggle functionality - Now handled by theme.js
// Chart controls functionality (left for nav highlighting) remains below.
document.addEventListener('DOMContentLoaded', function() {
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

// Quick actions, tasks, weather, profile wiring
function setupDashboard() {
    const navigateFieldsBtn = document.getElementById('navigateFieldsBtn');
    const navigateCropsBtn = document.getElementById('navigateCropsBtn');
    const TASK_STORAGE_KEY = 'smartfarmer_tasks';
    const FIELD_STORAGE_KEY = 'smartfarmer_task_fields';
    const DEFAULT_FIELDS = ['North Field', 'South Field', 'Greenhouse'];
    const tasksContainer = document.getElementById('tasks-list');
    const taskModal = document.getElementById('addTaskModal');
    const taskForm = document.getElementById('taskForm');
    const taskFieldSelect = document.getElementById('taskFieldSelect');
    const taskFieldCustomWrap = document.getElementById('taskFieldCustomWrap');
    const taskCustomFieldInput = document.getElementById('taskCustomField');
    const taskDueInput = document.getElementById('taskDueInput');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    let serverTasksCache = [];

    const readSessionJSON = (key, fallback) => {
        try {
            const raw = sessionStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (err) {
            console.warn('Unable to parse session storage key', key, err);
            return fallback;
        }
    };

    const writeSessionJSON = (key, value) => {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.warn('Unable to persist session storage key', key, err);
        }
    };

    const storeTasks = (tasks) => writeSessionJSON(TASK_STORAGE_KEY, tasks);

    const getStoredTasks = () => {
        return readSessionJSON(TASK_STORAGE_KEY, []);
    };

    const getStoredFields = () => readSessionJSON(FIELD_STORAGE_KEY, DEFAULT_FIELDS);

    const storeFields = (fields) => writeSessionJSON(FIELD_STORAGE_KEY, fields);

    const collectFieldsFromTasks = (tasks = []) =>
        tasks
            .map((task) => (task.field || task.field_name || task.location || '').trim())
            .filter(Boolean);

    const refreshFieldOptions = (tasks = []) => {
        const current = new Set([...DEFAULT_FIELDS, ...getStoredFields()]);
        collectFieldsFromTasks(tasks).forEach((name) => current.add(name));
        const list = Array.from(current);
        storeFields(list);
        return list;
    };

    const populateTaskFieldSelect = (tasks = []) => {
        if (!taskFieldSelect) return;
        const options = refreshFieldOptions(tasks);
        taskFieldSelect.innerHTML = options
            .map((field) => `<option value="${field}">${field}</option>`)
            .join('') + '<option value="__custom__">Custom field...</option>';
        taskFieldSelect.value = options[0] || '__custom__';
        toggleCustomFieldInput();
    };

    const toggleCustomFieldInput = () => {
        if (!taskFieldSelect || !taskFieldCustomWrap) return;
        const needsCustom = taskFieldSelect.value === '__custom__';
        taskFieldCustomWrap.classList.toggle('hidden', !needsCustom);
        if (needsCustom) {
            taskCustomFieldInput?.focus();
        } else if (taskCustomFieldInput) {
            taskCustomFieldInput.value = '';
            taskCustomFieldInput.blur();
        }
    };

    const closeTaskModal = () => {
        if (!taskModal) return;
        taskModal.classList.remove('active');
        taskModal.classList.add('hidden');
        taskForm?.reset();
        if (taskDueInput) {
            taskDueInput.value = '';
        }
        if (taskFieldSelect && taskFieldSelect.options.length) {
            taskFieldSelect.selectedIndex = 0;
        }
        if (taskCustomFieldInput) {
            taskCustomFieldInput.value = '';
            taskCustomFieldInput.blur();
        }
        toggleCustomFieldInput();
    };

    const renderTasksList = (tasks) => {
        if (!tasksContainer) return;
        if (tasks.length === 0) {
            tasksContainer.innerHTML = `<div class="empty-state">No upcoming tasks. Add a task to get started.</div>`;
            return;
        }
        tasksContainer.innerHTML = '';
        tasks.forEach((task) => {
            const due = task.due || task.due_date || 'TBD';
            const location = task.field || task.location || 'Field';
            const title = task.title || task.name || 'Task';
            const status = task.status || 'scheduled';
            const notes = task.notes || '';
            const item = document.createElement('div');
            item.className = 'task-item';
            item.innerHTML = `
                <div class="task-info">
                    <div class="task-icon watering" aria-hidden="true"><i class="fas fa-tint" aria-hidden="true"></i></div>
                    <div>
                        <h3 class="task-title">${title}</h3>
                        <p class="task-location">
                            <span class="task-field-chip">${location}</span>
                        </p>
                        ${notes ? `<p class="task-notes">${notes}</p>` : ''}
                    </div>
                </div>
                <div class="task-meta">
                    <p class="task-due">Due: ${due}</p>
                    <span class="status-badge ${status}">${status}</span>
                    <button class="task-remove-btn" data-task-id="${task.id}" aria-label="Remove task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            tasksContainer.appendChild(item);
        });
        tasksContainer.querySelectorAll('.task-remove-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const id = event.currentTarget.getAttribute('data-task-id');
                if (!id) return;
                const stored = getStoredTasks().filter((t) => String(t.id) !== id);
                storeTasks(stored);
                renderTasksList([...stored, ...serverTasksCache]);
            });
        });
    };

    const renderDashboardTasks = (serverTasks = []) => {
        serverTasksCache = serverTasks;
        const persisted = getStoredTasks();
        const combined = [...persisted, ...serverTasks];
        renderTasksList(combined);
        populateTaskFieldSelect(combined);
    };

    const handleTaskFormSubmit = (event) => {
        event.preventDefault();
        const title = taskForm?.title?.value?.trim();
        if (!title) return;
        let fieldName = taskFieldSelect?.value || '';
        if (fieldName === '__custom__') {
            fieldName = taskCustomFieldInput?.value?.trim() || '';
        }
        if (!fieldName) {
            fieldName = 'Field';
        }
        const due = taskForm?.due?.value || new Date().toISOString().split('T')[0];
        const notes = taskForm?.notes?.value?.trim() || '';
        const task = {
            id: Date.now(),
            title,
            field: fieldName,
            due,
            notes,
            status: 'scheduled'
        };
        const persisted = getStoredTasks();
        const updated = [task, ...persisted];
        storeTasks(updated);
        const combined = [...updated, ...serverTasksCache];
        renderTasksList(combined);
        populateTaskFieldSelect(combined);
        closeTaskModal();
    };

    const initWeather = async () => {
        try {
            const res = await getDashboard(5);
            if (!res || !res.success) return;
            const data = res.data || {};
            window.currentProfile = data.profile || {};
            try {
                const profileResponse = await getProfile();
                if (profileResponse?.success && profileResponse?.data) {
                    window.currentProfile = { ...(window.currentProfile || {}), ...profileResponse.data };
                }
            } catch (err) {
                console.warn('Unable to load full profile details', err);
            }
            const city = (window.currentProfile || {}).city;
            if (city) {
                updateWeatherFromCity(city);
            }
            const tasks = data.recent_tasks || data.tasks || data.demo?.tasks || [];
            renderDashboardTasks(tasks);
        } catch (err) {
            console.error('initWeather error', err);
        }
    };

    const openTaskModal = () => {
        if (!taskModal) return;
        const combinedTasks = [...getStoredTasks(), ...serverTasksCache];
        populateTaskFieldSelect(combinedTasks);
        if (taskDueInput && !taskDueInput.value) {
            taskDueInput.value = new Date().toISOString().split('T')[0];
        }
        taskModal.classList.remove('hidden');
        taskModal.classList.add('active');
    };

    window.openTaskModal = openTaskModal;

    taskForm?.addEventListener('submit', handleTaskFormSubmit);
    document.getElementById('closeTaskModal')?.addEventListener('click', closeTaskModal);
    cancelTaskBtn?.addEventListener('click', closeTaskModal);
    taskFieldSelect?.addEventListener('change', toggleCustomFieldInput);

    if (navigateFieldsBtn) {
        navigateFieldsBtn.addEventListener('click', () => {
            window.location.href = 'fields.html';
        });
    }

    if (navigateCropsBtn) {
        navigateCropsBtn.addEventListener('click', () => {
            window.location.href = 'crops.html';
        });
    }

    populateTaskFieldSelect(getStoredTasks());
    window.renderDashboardTasks = renderDashboardTasks;
    initWeather();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDashboard, { once: true });
} else {
    setupDashboard();
}

document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-task]');
    if (!trigger) return;
    event.preventDefault();
    if (typeof window.openTaskModal === 'function') {
        window.openTaskModal();
    }
});
