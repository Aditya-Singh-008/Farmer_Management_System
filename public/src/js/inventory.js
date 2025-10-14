// Inventory Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize inventory management
    initializeInventory();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load inventory data
    loadInventoryData();
    
    // Initialize charts
    initializeCharts();
});

// Sample inventory data
const sampleInventory = [
    {
        id: 1,
        name: 'Wheat Seeds - Premium',
        category: 'seeds',
        quantity: 45,
        unit: 'kg',
        minStock: 20,
        cost: 2.50,
        supplier: 'SeedCo Inc.',
        location: 'Storage Room A',
        description: 'High-yield wheat seeds for spring planting',
        lastUpdated: '2023-10-15'
    },
    {
        id: 2,
        name: 'NPK Fertilizer',
        category: 'fertilizers',
        quantity: 8,
        unit: 'bags',
        minStock: 10,
        cost: 45.00,
        supplier: 'AgroSupply Ltd.',
        location: 'Fertilizer Shed',
        description: 'Balanced NPK fertilizer 10-10-10',
        lastUpdated: '2023-10-18'
    },
    {
        id: 3,
        name: 'Organic Pesticide',
        category: 'pesticides',
        quantity: 15,
        unit: 'l',
        minStock: 5,
        cost: 28.50,
        supplier: 'EcoProtect',
        location: 'Chemical Storage',
        description: 'Organic pesticide for pest control',
        lastUpdated: '2023-10-20'
    },
    {
        id: 4,
        name: 'Tractor Diesel Fuel',
        category: 'equipment',
        quantity: 200,
        unit: 'l',
        minStock: 50,
        cost: 1.45,
        supplier: 'Local Fuel Station',
        location: 'Fuel Tank',
        description: 'Diesel fuel for farm machinery',
        lastUpdated: '2023-10-22'
    },
    {
        id: 5,
        name: 'Harvesting Tools Set',
        category: 'tools',
        quantity: 3,
        unit: 'units',
        minStock: 2,
        cost: 120.00,
        supplier: 'FarmTools Co.',
        location: 'Tool Shed',
        description: 'Complete set of harvesting tools',
        lastUpdated: '2023-10-25'
    },
    {
        id: 6,
        name: 'Irrigation Pipes',
        category: 'equipment',
        quantity: 25,
        unit: 'units',
        minStock: 15,
        cost: 35.00,
        supplier: 'Irrigation Solutions',
        location: 'Equipment Storage',
        description: 'PVC pipes for irrigation system',
        lastUpdated: '2023-10-28'
    },
    {
        id: 7,
        name: 'Corn Seeds - Hybrid',
        category: 'seeds',
        quantity: 12,
        unit: 'kg',
        minStock: 15,
        cost: 3.20,
        supplier: 'SeedCo Inc.',
        location: 'Storage Room A',
        description: 'Hybrid corn seeds for high yield',
        lastUpdated: '2023-10-30'
    },
    {
        id: 8,
        name: 'Protective Gear Set',
        category: 'tools',
        quantity: 5,
        unit: 'units',
        minStock: 3,
        cost: 85.00,
        supplier: 'SafetyFirst Ltd.',
        location: 'Tool Shed',
        description: 'Protective gear for farm workers',
        lastUpdated: '2023-11-01'
    }
];

let currentInventory = [...sampleInventory];
let currentEditingItem = null;

// Initialize inventory management
function initializeInventory() {
    updateStats();
}

// Set up event listeners
function setupEventListeners() {
    // Add item modal
    const addItemBtn = document.getElementById('addItemBtn');
    const addItemModal = document.getElementById('addItemModal');
    const addItemForm = document.getElementById('addItemForm');

    if (addItemBtn && addItemModal) {
        addItemBtn.addEventListener('click', () => {
            addItemModal.classList.add('active');
        });
    }

    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }

    // Edit item modal
    const editItemModal = document.getElementById('editItemModal');
    const editItemForm = document.getElementById('editItemForm');

    if (editItemForm) {
        editItemForm.addEventListener('submit', handleEditItem);
    }

    // Stock adjustment modal
    const adjustStockModal = document.getElementById('adjustStockModal');
    const adjustStockForm = document.getElementById('adjustStockForm');
    const adjustmentType = document.getElementById('adjustmentType');
    const adjustmentQuantity = document.getElementById('adjustmentQuantity');

    if (adjustStockForm) {
        adjustStockForm.addEventListener('submit', handleStockAdjustment);
    }

    if (adjustmentType && adjustmentQuantity) {
        adjustmentType.addEventListener('change', updateStockPreview);
        adjustmentQuantity.addEventListener('input', updateStockPreview);
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterInventory(this.dataset.category);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInventory');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Sort functionality
    const sortSelect = document.getElementById('sortInventory');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    // View toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            toggleView(this.dataset.view);
        });
    });

    // Quick actions
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            handleQuickAction(this.dataset.action);
        });
    });

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportInventory);
    }

    // Low stock button
    const lowStockBtn = document.getElementById('lowStockBtn');
    if (lowStockBtn) {
        lowStockBtn.addEventListener('click', showLowStockItems);
    }

    // Modal close buttons
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                resetForms();
            }
        });
    });

    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                resetForms();
            }
        });
    });
}

// Load inventory data
function loadInventoryData() {
    displayInventoryItems(currentInventory);
    updateLowStockAlerts();
}

// Display inventory items
function displayInventoryItems(items) {
    const inventoryGrid = document.getElementById('inventoryGrid');
    if (!inventoryGrid) return;

    inventoryGrid.innerHTML = '';

    if (items.length === 0) {
        inventoryGrid.innerHTML = `
            <div class="no-items">
                <i class="fas fa-box-open"></i>
                <h3>No inventory items found</h3>
                <p>Try adjusting your filters or add new items</p>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const inventoryItem = createInventoryItem(item);
        inventoryGrid.appendChild(inventoryItem);
    });
}

// Create inventory item element
function createInventoryItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = `inventory-item ${getStockStatus(item)}`;
    
    const stockPercentage = Math.min((item.quantity / item.minStock) * 100, 100);
    const stockLevelClass = getStockLevelClass(stockPercentage);
    
    itemElement.innerHTML = `
        <div class="item-header">
            <span class="item-category category-${item.category}">${item.category}</span>
            <div class="item-actions">
                <button class="action-icon edit-item" data-item-id="${item.id}" title="Edit Item">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-icon adjust-stock" data-item-id="${item.id}" title="Adjust Stock">
                    <i class="fas fa-exchange-alt"></i>
                </button>
                <button class="action-icon delete-item" data-item-id="${item.id}" title="Delete Item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        
        <div class="item-content">
            <h3 class="item-name">${item.name}</h3>
            <p class="item-description">${item.description}</p>
            
            <div class="item-details">
                <div class="detail-item">
                    <span class="detail-label">Quantity</span>
                    <span class="detail-value ${getStockStatus(item)}">${item.quantity} ${item.unit}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Min Stock</span>
                    <span class="detail-value">${item.minStock} ${item.unit}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Unit Cost</span>
                    <span class="detail-value cost">$${item.cost.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total Value</span>
                    <span class="detail-value cost">$${(item.quantity * item.cost).toFixed(2)}</span>
                </div>
            </div>
            
            <div class="stock-bar">
                <div class="stock-level ${stockLevelClass}" style="width: ${stockPercentage}%"></div>
            </div>
            <div class="stock-info">
                <span>Stock Level</span>
                <span>${Math.round(stockPercentage)}%</span>
            </div>
        </div>
        
        <div class="item-footer">
            <span class="item-supplier">${item.supplier}</span>
            <span class="item-location">
                <i class="fas fa-map-marker-alt"></i>
                ${item.location}
            </span>
        </div>
    `;

    // Add event listeners to action buttons
    const editBtn = itemElement.querySelector('.edit-item');
    const adjustBtn = itemElement.querySelector('.adjust-stock');
    const deleteBtn = itemElement.querySelector('.delete-item');

    editBtn.addEventListener('click', () => openEditItemModal(item.id));
    adjustBtn.addEventListener('click', () => openAdjustStockModal(item.id));
    deleteBtn.addEventListener('click', () => deleteItem(item.id));

    return itemElement;
}

// Get stock status
function getStockStatus(item) {
    const ratio = item.quantity / item.minStock;
    if (ratio <= 0.3) return 'critical';
    if (ratio <= 0.6) return 'low-stock';
    return '';
}

// Get stock level class
function getStockLevelClass(percentage) {
    if (percentage >= 60) return 'high';
    if (percentage >= 30) return 'medium';
    return 'low';
}

// Update low stock alerts
function updateLowStockAlerts() {
    const lowStockAlerts = document.getElementById('lowStockAlerts');
    if (!lowStockAlerts) return;

    const lowStockItems = currentInventory.filter(item => item.quantity <= item.minStock);
    
    lowStockAlerts.innerHTML = '';

    if (lowStockItems.length === 0) {
        lowStockAlerts.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <p>All items are sufficiently stocked</p>
            </div>
        `;
        return;
    }

    lowStockItems.forEach(item => {
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${item.quantity === 0 ? 'critical' : 'warning'}`;
        
        alertItem.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-${item.quantity === 0 ? 'times-circle' : 'exclamation-triangle'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${item.name}</div>
                <div class="alert-message">
                    Current stock: ${item.quantity} ${item.unit} (Min: ${item.minStock} ${item.unit})
                </div>
            </div>
            <button class="alert-action" data-item-id="${item.id}">Reorder</button>
        `;

        const reorderBtn = alertItem.querySelector('.alert-action');
        reorderBtn.addEventListener('click', () => handleReorder(item.id));

        lowStockAlerts.appendChild(alertItem);
    });
}

// Update statistics
function updateStats() {
    const totalItems = currentInventory.length;
    const lowStockItems = currentInventory.filter(item => item.quantity <= item.minStock).length;
    const totalValue = currentInventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const categories = new Set(currentInventory.map(item => item.category)).size;

    // Update stats cards
    document.querySelectorAll('.stat-card .card-value')[0].textContent = totalItems;
    document.querySelectorAll('.stat-card .card-value')[1].textContent = lowStockItems;
    document.querySelectorAll('.stat-card .card-value')[2].textContent = `$${totalValue.toLocaleString()}`;
    document.querySelectorAll('.stat-card .card-value')[3].textContent = categories;
}

// Handle add item form submission
function handleAddItem(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const itemData = {
        id: Date.now(), // Generate unique ID
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        unit: document.getElementById('itemUnit').value,
        minStock: parseInt(document.getElementById('itemMinStock').value),
        cost: parseFloat(document.getElementById('itemCost').value),
        supplier: document.getElementById('itemSupplier').value,
        location: document.getElementById('itemLocation').value,
        description: document.getElementById('itemDescription').value,
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    currentInventory.push(itemData);
    displayInventoryItems(currentInventory);
    updateLowStockAlerts();
    updateStats();
    
    showNotification('Item added successfully!', 'success');
    
    const modal = document.getElementById('addItemModal');
    modal.classList.remove('active');
    e.target.reset();
}

// Open edit item modal
function openEditItemModal(itemId) {
    const item = currentInventory.find(i => i.id === itemId);
    if (!item) return;

    currentEditingItem = item;

    // Populate form fields
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemCategory').value = item.category;
    document.getElementById('editItemQuantity').value = item.quantity;
    document.getElementById('editItemUnit').value = item.unit;
    document.getElementById('editItemCost').value = item.cost;
    document.getElementById('editItemSupplier').value = item.supplier;
    document.getElementById('editItemMinStock').value = item.minStock;
    document.getElementById('editItemLocation').value = item.location;
    document.getElementById('editItemDescription').value = item.description;

    const modal = document.getElementById('editItemModal');
    modal.classList.add('active');
}

// Handle edit item form submission
function handleEditItem(e) {
    e.preventDefault();
    
    const itemId = parseInt(document.getElementById('editItemId').value);
    const itemIndex = currentInventory.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) return;

    currentInventory[itemIndex] = {
        ...currentInventory[itemIndex],
        name: document.getElementById('editItemName').value,
        category: document.getElementById('editItemCategory').value,
        quantity: parseInt(document.getElementById('editItemQuantity').value),
        unit: document.getElementById('editItemUnit').value,
        cost: parseFloat(document.getElementById('editItemCost').value),
        supplier: document.getElementById('editItemSupplier').value,
        minStock: parseInt(document.getElementById('editItemMinStock').value),
        location: document.getElementById('editItemLocation').value,
        description: document.getElementById('editItemDescription').value,
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    displayInventoryItems(currentInventory);
    updateLowStockAlerts();
    updateStats();
    
    showNotification('Item updated successfully!', 'success');
    
    const modal = document.getElementById('editItemModal');
    modal.classList.remove('active');
    resetForms();
}

// Open adjust stock modal
function openAdjustStockModal(itemId) {
    const item = currentInventory.find(i => i.id === itemId);
    if (!item) return;

    currentEditingItem = item;

    // Populate modal fields
    document.getElementById('adjustItemId').value = item.id;
    document.getElementById('adjustCurrentStock').value = item.quantity;
    document.getElementById('adjustItemName').textContent = item.name;
    document.getElementById('adjustCurrentQty').textContent = item.quantity;
    document.getElementById('adjustCurrentUnit').textContent = item.unit;
    document.getElementById('adjustmentQuantity').value = '';
    document.getElementById('adjustmentReason').value = 'usage';
    document.getElementById('adjustmentNotes').value = '';

    updateStockPreview();

    const modal = document.getElementById('adjustStockModal');
    modal.classList.add('active');
}

// Update stock preview
function updateStockPreview() {
    const currentStock = parseInt(document.getElementById('adjustCurrentStock').value);
    const adjustmentType = document.getElementById('adjustmentType').value;
    const adjustmentQuantity = parseInt(document.getElementById('adjustmentQuantity').value) || 0;
    
    let newStock;
    
    switch (adjustmentType) {
        case 'add':
            newStock = currentStock + adjustmentQuantity;
            break;
        case 'remove':
            newStock = Math.max(0, currentStock - adjustmentQuantity);
            break;
        case 'set':
            newStock = adjustmentQuantity;
            break;
        default:
            newStock = currentStock;
    }

    document.getElementById('newStockLevel').textContent = newStock;
    document.getElementById('newStockUnit').textContent = document.getElementById('adjustCurrentUnit').textContent;
}

// Handle stock adjustment
function handleStockAdjustment(e) {
    e.preventDefault();
    
    const itemId = parseInt(document.getElementById('adjustItemId').value);
    const itemIndex = currentInventory.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) return;

    const adjustmentType = document.getElementById('adjustmentType').value;
    const adjustmentQuantity = parseInt(document.getElementById('adjustmentQuantity').value);
    const reason = document.getElementById('adjustmentReason').value;
    const notes = document.getElementById('adjustmentNotes').value;

    let newQuantity;
    const currentQuantity = currentInventory[itemIndex].quantity;

    switch (adjustmentType) {
        case 'add':
            newQuantity = currentQuantity + adjustmentQuantity;
            break;
        case 'remove':
            newQuantity = Math.max(0, currentQuantity - adjustmentQuantity);
            break;
        case 'set':
            newQuantity = adjustmentQuantity;
            break;
        default:
            newQuantity = currentQuantity;
    }

    currentInventory[itemIndex].quantity = newQuantity;
    currentInventory[itemIndex].lastUpdated = new Date().toISOString().split('T')[0];

    // Log the adjustment (in a real app, this would be saved to a database)
    console.log(`Stock adjustment for ${currentInventory[itemIndex].name}:`, {
        type: adjustmentType,
        quantity: adjustmentQuantity,
        reason: reason,
        notes: notes,
        previousStock: currentQuantity,
        newStock: newQuantity,
        timestamp: new Date().toISOString()
    });

    displayInventoryItems(currentInventory);
    updateLowStockAlerts();
    updateStats();
    
    showNotification('Stock level updated successfully!', 'success');
    
    const modal = document.getElementById('adjustStockModal');
    modal.classList.remove('active');
    resetForms();
}

// Delete item
function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }

    currentInventory = currentInventory.filter(item => item.id !== itemId);
    displayInventoryItems(currentInventory);
    updateLowStockAlerts();
    updateStats();
    
    showNotification('Item deleted successfully!', 'success');
}

// Handle reorder
function handleReorder(itemId) {
    const item = currentInventory.find(i => i.id === itemId);
    if (!item) return;

    // In a real app, this would open a purchase order form or send a request to suppliers
    showNotification(`Reorder request sent for ${item.name}`, 'info');
    
    // Simulate reorder by increasing stock
    const itemIndex = currentInventory.findIndex(i => i.id === itemId);
    currentInventory[itemIndex].quantity = item.minStock + 10; // Add buffer
    
    displayInventoryItems(currentInventory);
    updateLowStockAlerts();
    updateStats();
}

// Filter inventory
function filterInventory(category) {
    let filteredItems = currentInventory;
    
    if (category !== 'all') {
        filteredItems = currentInventory.filter(item => item.category === category);
    }
    
    displayInventoryItems(filteredItems);
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        displayInventoryItems(currentInventory);
        return;
    }
    
    const filteredItems = currentInventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.supplier.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
    
    displayInventoryItems(filteredItems);
}

// Handle sort
function handleSort(e) {
    const sortBy = e.target.value;
    let sortedItems = [...currentInventory];
    
    switch (sortBy) {
        case 'name':
            sortedItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'quantity':
            sortedItems.sort((a, b) => b.quantity - a.quantity);
            break;
        case 'category':
            sortedItems.sort((a, b) => a.category.localeCompare(b.category));
            break;
        case 'value':
            sortedItems.sort((a, b) => (b.quantity * b.cost) - (a.quantity * a.cost));
            break;
        default:
            break;
    }
    
    displayInventoryItems(sortedItems);
}

// Toggle view
function toggleView(viewType) {
    const inventoryGrid = document.getElementById('inventoryGrid');
    if (inventoryGrid) {
        inventoryGrid.className = `inventory-grid ${viewType}-view`;
    }
}

// Handle quick actions
function handleQuickAction(action) {
    switch (action) {
        case 'reorder':
            showLowStockItems();
            break;
        case 'audit':
            startInventoryAudit();
            break;
        case 'export':
            exportInventory();
            break;
        case 'suppliers':
            contactSuppliers();
            break;
    }
}

// Show low stock items
function showLowStockItems() {
    const lowStockItems = currentInventory.filter(item => item.quantity <= item.minStock);
    
    if (lowStockItems.length === 0) {
        showNotification('No low stock items found!', 'info');
        return;
    }
    
    // Activate low stock filter
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
    
    displayInventoryItems(lowStockItems);
    showNotification(`Showing ${lowStockItems.length} low stock items`, 'info');
}

// Start inventory audit
function startInventoryAudit() {
    showNotification('Inventory audit started! Please verify all stock levels.', 'info');
    
    // In a real app, this would open an audit interface
    setTimeout(() => {
        showNotification('Inventory audit completed successfully!', 'success');
    }, 2000);
}

// Export inventory
function exportInventory() {
    // In a real app, this would generate and download a CSV or PDF
    const exportData = {
        timestamp: new Date().toISOString(),
        totalItems: currentInventory.length,
        totalValue: currentInventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0),
        items: currentInventory
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showNotification('Inventory exported successfully!', 'success');
}

// Contact suppliers
function contactSuppliers() {
    const suppliers = [...new Set(currentInventory.map(item => item.supplier))];
    showNotification(`Found ${suppliers.length} suppliers. Opening contact list...`, 'info');
    
    // In a real app, this would open a suppliers contact interface
}

// Initialize charts
function initializeCharts() {
    // Category Distribution Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        const categoryData = getCategoryDistribution();
        
        new Chart(categoryCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: [
                        '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', 
                        '#8b5cf6', '#06b6d4', '#ec4899', '#9ca3af'
                    ],
                    borderWidth: 2,
                    borderColor: 'var(--bg-primary)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'var(--text-primary)',
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    // Value Trend Chart
    const valueTrendCtx = document.getElementById('valueTrendChart');
    if (valueTrendCtx) {
        new Chart(valueTrendCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Inventory Value',
                    data: [8500, 9200, 10100, 11500, 10800, 12450, 12000],
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

// Get category distribution
function getCategoryDistribution() {
    const categories = {};
    
    currentInventory.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    return {
        labels: Object.keys(categories),
        values: Object.values(categories)
    };
}

// Reset forms
function resetForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    currentEditingItem = null;
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'error': return 'times-circle';
        default: return 'info-circle';
    }
}