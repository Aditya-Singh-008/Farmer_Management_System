// Crops Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set active crop
    setActiveCrop('wheat');
});

// Initialize all charts
function initializeCharts() {
    // Yield Estimate Chart
    const yieldCtx = document.getElementById('yieldChart');
    if (yieldCtx) {
        new Chart(yieldCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
                datasets: [{
                    label: 'Expected Yield (tons)',
                    data: [2, 3.5, 5, 6.5, 7.8, 8.5, 9.2, 9.8],
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
                        title: {
                            display: true,
                            text: 'Tons'
                        }
                    }
                }
            }
        });
    }

    // Input Usage Chart
    const inputCtx = document.getElementById('inputChart');
    if (inputCtx) {
        new Chart(inputCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Fertilizer (kg)',
                        data: [120, 190, 150, 200, 180, 170],
                        backgroundColor: 'rgba(79, 70, 229, 0.7)',
                    },
                    {
                        label: 'Pesticides (L)',
                        data: [80, 100, 120, 90, 110, 95],
                        backgroundColor: 'rgba(220, 38, 38, 0.7)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantity'
                        }
                    }
                }
            }
        });
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Crop icon click events
    const cropIcons = document.querySelectorAll('.crop-icon');
    cropIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const cropType = this.getAttribute('data-crop');
            setActiveCrop(cropType);
        });
    });

    // Chart control buttons
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // In a real app, you would update the chart data here
        });
    });

    // Add crop modal
    const addCropBtn = document.getElementById('addCropBtn');
    const addCropModal = document.getElementById('addCropModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const addCropForm = document.getElementById('addCropForm');

    if (addCropBtn && addCropModal) {
        addCropBtn.addEventListener('click', () => {
            addCropModal.classList.add('active');
        });

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                addCropModal.classList.remove('active');
            });
        });

        // Close modal when clicking outside
        addCropModal.addEventListener('click', (e) => {
            if (e.target === addCropModal) {
                addCropModal.classList.remove('active');
            }
        });
    }

    if (addCropForm) {
        addCropForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle form submission
            const formData = new FormData(this);
            const cropData = Object.fromEntries(formData);
            
            // In a real app, you would send this data to your backend
            console.log('Adding new crop:', cropData);
            
            // Show success message and close modal
            alert('Crop added successfully!');
            addCropModal.classList.remove('active');
            this.reset();
        });
    }

    // Edit and delete buttons
    const editBtn = document.querySelector('.edit-btn');
    const deleteBtn = document.querySelector('.delete-btn');

    if (editBtn) {
        editBtn.addEventListener('click', function() {
            // In a real app, this would open an edit form
            alert('Edit crop functionality would open here');
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this crop?')) {
                // In a real app, this would send a delete request
                alert('Crop deleted successfully!');
                // Refresh the page or update UI
                location.reload();
            }
        });
    }
}

// Set active crop and update display
function setActiveCrop(cropType) {
    // Remove active class from all crop icons
    document.querySelectorAll('.crop-icon').forEach(icon => {
        icon.classList.remove('active');
    });

    // Add active class to selected crop icon
    const selectedIcon = document.querySelector(`.crop-icon[data-crop="${cropType}"]`);
    if (selectedIcon) {
        selectedIcon.classList.add('active');
    }

    // Update crop details based on selected crop
    updateCropDetails(cropType);
}

// Update crop details based on selected crop type
function updateCropDetails(cropType) {
    const cropData = getCropData(cropType);
    
    // Update crop title and basic info
    const cropTitle = document.querySelector('.crop-title h2');
    const cropSubtitle = document.querySelector('.crop-title p');
    const cropImage = document.querySelector('.crop-image .image-placeholder');
    
    if (cropTitle) cropTitle.textContent = `${cropData.name} - ${cropData.field}`;
    if (cropSubtitle) cropSubtitle.textContent = `Planted on ${cropData.plantedDate} • ${cropData.area}`;
    
    // Update crop image
    if (cropImage) {
        cropImage.className = `image-placeholder ${cropType}-bg`;
        cropImage.innerHTML = `<i class="${cropData.icon}"></i>`;
    }
    
    // Update basic info
    updateBasicInfo(cropData);
    
    // Update growth stages
    updateGrowthStages(cropData.growthStages);
    
    // Update input usage
    updateInputUsage(cropData.inputs);
}

// Get crop data based on type
function getCropData(cropType) {
    const cropData = {
        wheat: {
            name: 'Wheat',
            field: 'Field A',
            plantedDate: 'March 15, 2023',
            area: '5.2 acres',
            icon: 'fas fa-wheat-alt',
            soilType: 'Loamy',
            health: 'Good',
            expectedYield: '9.8 tons',
            marketPrice: '$210/ton',
            growthStages: [
                { name: 'Sowing', progress: 100, status: 'completed' },
                { name: 'Germination', progress: 100, status: 'completed' },
                { name: 'Vegetative', progress: 100, status: 'completed' },
                { name: 'Flowering', progress: 70, status: 'in-progress' },
                { name: 'Harvest', progress: 0, status: 'pending' }
            ],
            inputs: [
                { name: 'Fertilizer', usage: 65 },
                { name: 'Pesticides', usage: 40 },
                { name: 'Water', usage: 75 }
            ]
        },
        corn: {
            name: 'Corn',
            field: 'Field B',
            plantedDate: 'April 1, 2023',
            area: '3.8 acres',
            icon: 'fas fa-corn',
            soilType: 'Sandy Loam',
            health: 'Good',
            expectedYield: '12.5 tons',
            marketPrice: '$180/ton',
            growthStages: [
                { name: 'Sowing', progress: 100, status: 'completed' },
                { name: 'Germination', progress: 100, status: 'completed' },
                { name: 'Vegetative', progress: 80, status: 'in-progress' },
                { name: 'Reproductive', progress: 20, status: 'in-progress' },
                { name: 'Harvest', progress: 0, status: 'pending' }
            ],
            inputs: [
                { name: 'Fertilizer', usage: 45 },
                { name: 'Pesticides', usage: 60 },
                { name: 'Water', usage: 65 }
            ]
        },
        tomato: {
            name: 'Tomato',
            field: 'Greenhouse 1',
            plantedDate: 'February 20, 2023',
            area: '1.5 acres',
            icon: 'fas fa-pepper-hot',
            soilType: 'Potting Mix',
            health: 'Excellent',
            expectedYield: '8.2 tons',
            marketPrice: '$1.2/kg',
            growthStages: [
                { name: 'Sowing', progress: 100, status: 'completed' },
                { name: 'Germination', progress: 100, status: 'completed' },
                { name: 'Vegetative', progress: 100, status: 'completed' },
                { name: 'Flowering', progress: 100, status: 'completed' },
                { name: 'Fruiting', progress: 85, status: 'in-progress' }
            ],
            inputs: [
                { name: 'Fertilizer', usage: 75 },
                { name: 'Pesticides', usage: 35 },
                { name: 'Water', usage: 80 }
            ]
        },
        rice: {
            name: 'Rice',
            field: 'Paddy Field',
            plantedDate: 'January 10, 2023',
            area: '8.5 acres',
            icon: 'fas fa-seedling',
            soilType: 'Clay',
            health: 'Good',
            expectedYield: '11.3 tons',
            marketPrice: '$320/ton',
            growthStages: [
                { name: 'Sowing', progress: 100, status: 'completed' },
                { name: 'Germination', progress: 100, status: 'completed' },
                { name: 'Tillering', progress: 90, status: 'in-progress' },
                { name: 'Stem Elongation', progress: 40, status: 'in-progress' },
                { name: 'Harvest', progress: 0, status: 'pending' }
            ],
            inputs: [
                { name: 'Fertilizer', usage: 55 },
                { name: 'Pesticides', usage: 25 },
                { name: 'Water', usage: 95 }
            ]
        },
        potato: {
            name: 'Potato',
            field: 'Field C',
            plantedDate: 'March 25, 2023',
            area: '4.2 acres',
            icon: 'fas fa-potato',
            soilType: 'Sandy',
            health: 'Needs Attention',
            expectedYield: '6.7 tons',
            marketPrice: '$0.8/kg',
            growthStages: [
                { name: 'Sowing', progress: 100, status: 'completed' },
                { name: 'Sprouting', progress: 100, status: 'completed' },
                { name: 'Vegetative', progress: 100, status: 'completed' },
                { name: 'Tuber Initiation', progress: 60, status: 'in-progress' },
                { name: 'Harvest', progress: 0, status: 'pending' }
            ],
            inputs: [
                { name: 'Fertilizer', usage: 70 },
                { name: 'Pesticides', usage: 50 },
                { name: 'Water', usage: 60 }
            ]
        },
        apple: {
            name: 'Apple',
            field: 'Orchard North',
            plantedDate: 'January 5, 2020',
            area: '12.0 acres',
            icon: 'fas fa-apple-alt',
            soilType: 'Loamy',
            health: 'Excellent',
            expectedYield: '15.2 tons',
            marketPrice: '$1.5/kg',
            growthStages: [
                { name: 'Dormant', progress: 100, status: 'completed' },
                { name: 'Bud Development', progress: 100, status: 'completed' },
                { name: 'Flowering', progress: 100, status: 'completed' },
                { name: 'Fruit Development', progress: 70, status: 'in-progress' },
                { name: 'Harvest', progress: 0, status: 'pending' }
            ],
            inputs: [
                { name: 'Fertilizer', usage: 40 },
                { name: 'Pesticides', usage: 65 },
                { name: 'Water', usage: 55 }
            ]
        }
    };

    return cropData[cropType] || cropData.wheat;
}

// Update basic information in the UI
function updateBasicInfo(cropData) {
    const infoItems = {
        'Planted Date': cropData.plantedDate,
        'Area': cropData.area,
        'Soil Type': cropData.soilType,
        'Health Status': cropData.health,
        'Expected Yield': cropData.expectedYield,
        'Market Price': cropData.marketPrice
    };

    const infoGrid = document.querySelector('.basic-info-grid');
    if (infoGrid) {
        const infoElements = infoGrid.querySelectorAll('.info-item');
        let index = 0;
        
        for (const [key, value] of Object.entries(infoItems)) {
            if (infoElements[index]) {
                const label = infoElements[index].querySelector('label');
                const valueEl = infoElements[index].querySelector('p');
                
                if (label) label.textContent = key;
                if (valueEl) {
                    valueEl.textContent = value;
                    // Add status class for health
                    if (key === 'Health Status') {
                        valueEl.className = '';
                        if (value.toLowerCase().includes('excellent') || value.toLowerCase().includes('good')) {
                            valueEl.classList.add('status-good');
                        } else if (value.toLowerCase().includes('attention')) {
                            valueEl.classList.add('status-warning');
                        }
                    }
                }
            }
            index++;
        }
    }
}

// Update growth stages in the UI
function updateGrowthStages(growthStages) {
    const growthTimeline = document.querySelector('.growth-timeline');
    if (growthTimeline) {
        growthTimeline.innerHTML = '';
        
        growthStages.forEach(stage => {
            const stageElement = document.createElement('div');
            stageElement.className = 'growth-stage';
            
            stageElement.innerHTML = `
                <div class="stage-info">
                    <span class="stage-name">${stage.name}</span>
                    <span class="stage-status ${stage.status}">
                        ${stage.status === 'completed' ? 'Completed' : 
                          stage.status === 'in-progress' ? `In Progress (${stage.progress}%)` : 'Not Started'}
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stage.progress}%"></div>
                </div>
            `;
            
            growthTimeline.appendChild(stageElement);
        });
    }
}

// Update input usage in the UI
function updateInputUsage(inputs) {
    const inputsGrid = document.querySelector('.inputs-grid');
    if (inputsGrid) {
        inputsGrid.innerHTML = '';
        
        inputs.forEach(input => {
            const inputElement = document.createElement('div');
            inputElement.className = 'input-item';
            
            inputElement.innerHTML = `
                <div class="input-header">
                    <span class="input-name">${input.name}</span>
                    <span class="input-usage">${input.usage}% used</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${input.name.toLowerCase()}" style="width: ${input.usage}%"></div>
                </div>
            `;
            
            inputsGrid.appendChild(inputElement);
        });
    }
}

// Export functionality for crop data
function exportCropData() {
    // In a real app, this would generate and download a CSV or PDF
    alert('Export functionality would generate a report here');
}

// Filter crops functionality
function filterCrops(filterType) {
    // In a real app, this would filter the displayed crops
    console.log(`Filtering crops by: ${filterType}`);
}