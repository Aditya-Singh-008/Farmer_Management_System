// Marketplace JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize marketplace
    initializeMarketplace();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial listings
    loadListings();
    
    // Initialize charts
    initializeCharts();
});

// Sample crop data
const sampleCrops = [
    {
        id: 1,
        name: 'Organic Wheat',
        type: 'wheat',
        farmer: 'Green Fields Farm',
        location: 'North Region',
        price: 2.10,
        quantity: 500,
        harvestDate: '2023-10-15',
        rating: 4.8,
        image: 'wheat-bg',
        icon: 'fas fa-wheat-alt',
        description: 'Premium organic wheat grown with sustainable farming practices.',
        immediate: true
    },
    {
        id: 2,
        name: 'Sweet Corn',
        type: 'corn',
        farmer: 'Sunshine Farms',
        location: 'South Region',
        price: 1.80,
        quantity: 300,
        harvestDate: '2023-10-20',
        rating: 4.6,
        image: 'corn-bg',
        icon: 'fas fa-corn',
        description: 'Fresh sweet corn harvested daily, perfect for markets.',
        immediate: true
    },
    {
        id: 3,
        name: 'Ripe Tomatoes',
        type: 'tomato',
        farmer: 'Valley Growers',
        location: 'East Region',
        price: 2.50,
        quantity: 200,
        harvestDate: '2023-10-18',
        rating: 4.9,
        image: 'tomato-bg',
        icon: 'fas fa-pepper-hot',
        description: 'Vine-ripened tomatoes with exceptional flavor.',
        immediate: true
    },
    {
        id: 4,
        name: 'Basmati Rice',
        type: 'rice',
        farmer: 'Paddy Fields Co.',
        location: 'West Region',
        price: 3.20,
        quantity: 400,
        harvestDate: '2023-11-01',
        rating: 4.7,
        image: 'rice-bg',
        icon: 'fas fa-seedling',
        description: 'Premium basmati rice with long grains and aromatic flavor.',
        immediate: false
    },
    {
        id: 5,
        name: 'Fresh Potatoes',
        type: 'potato',
        farmer: 'Mountain Farms',
        location: 'North Region',
        price: 1.20,
        quantity: 600,
        harvestDate: '2023-10-25',
        rating: 4.5,
        image: 'potato-bg',
        icon: 'fas fa-potato',
        description: 'Fresh potatoes perfect for cooking and processing.',
        immediate: true
    },
    {
        id: 6,
        name: 'Red Apples',
        type: 'apple',
        farmer: 'Orchard Fresh',
        location: 'East Region',
        price: 2.80,
        quantity: 150,
        harvestDate: '2023-10-22',
        rating: 4.8,
        image: 'apple-bg',
        icon: 'fas fa-apple-alt',
        description: 'Crisp red apples from our organic orchard.',
        immediate: true
    }
];

// Shopping cart
let cart = [];
let currentCrop = null;

// Initialize marketplace
function initializeMarketplace() {
    updateCartUI();
}

// Set up event listeners
function setupEventListeners() {
    // Cart toggle
    const cartToggle = document.getElementById('cartToggle');
    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');

    if (cartToggle && cartSidebar) {
        cartToggle.addEventListener('click', () => {
            cartSidebar.classList.add('active');
        });
    }

    if (closeCart && cartSidebar) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
        });
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Filter functionality
    setupFilters();

    // Sort functionality
    const sortSelect = document.getElementById('sortBy');
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

    // Sell crop modal
    const sellCropBtn = document.getElementById('sellCropBtn');
    const sellCropModal = document.getElementById('sellCropModal');
    const sellCropForm = document.getElementById('sellCropForm');

    if (sellCropBtn && sellCropModal) {
        sellCropBtn.addEventListener('click', () => {
            sellCropModal.classList.add('active');
        });
    }

    if (sellCropForm) {
        sellCropForm.addEventListener('submit', handleSellCrop);
    }

    // Clear filters
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }

    // Load more
    const loadMore = document.getElementById('loadMore');
    if (loadMore) {
        loadMore.addEventListener('click', loadMoreListings);
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Modal close buttons
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

// Setup filter functionality
function setupFilters() {
    // Crop type checkboxes
    const cropTypeCheckboxes = document.querySelectorAll('input[name="cropType"]');
    cropTypeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilter);
    });

    // Location filter
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.addEventListener('change', handleFilter);
    }

    // Price range
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const priceRange = document.getElementById('priceRange');

    if (minPrice && maxPrice && priceRange) {
        minPrice.addEventListener('input', handlePriceFilter);
        maxPrice.addEventListener('input', handlePriceFilter);
        priceRange.addEventListener('input', handlePriceRange);
    }

    // Harvest date
    const harvestRadios = document.querySelectorAll('input[name="harvestDate"]');
    harvestRadios.forEach(radio => {
        radio.addEventListener('change', handleFilter);
    });

    // Rating filter
    const ratingStars = document.querySelectorAll('.rating-filter .stars i');
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            setRatingFilter(rating);
        });
    });
}

// Handle search with debouncing
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterListings();
}

// Handle filter changes
function handleFilter() {
    filterListings();
}

// Handle price filter
function handlePriceFilter() {
    filterListings();
}

// Handle price range slider
function handlePriceRange(e) {
    const price = e.target.value;
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    
    if (minPrice && maxPrice) {
        maxPrice.value = price;
    }
    filterListings();
}

// Set rating filter
function setRatingFilter(rating) {
    const stars = document.querySelectorAll('.rating-filter .stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    filterListings();
}

// Handle sort
function handleSort(e) {
    const sortBy = e.target.value;
    sortListings(sortBy);
}

// Toggle view between grid and list
function toggleView(viewType) {
    const listingsGrid = document.getElementById('listingsGrid');
    if (listingsGrid) {
        listingsGrid.className = `listings-grid ${viewType}-view`;
        const cropCards = listingsGrid.querySelectorAll('.crop-card');
        cropCards.forEach(card => {
            card.classList.toggle('list-view', viewType === 'list');
        });
    }
}

// Load crop listings
function loadListings() {
    const listingsGrid = document.getElementById('listingsGrid');
    if (!listingsGrid) return;

    listingsGrid.innerHTML = '';
    
    sampleCrops.forEach(crop => {
        const cropCard = createCropCard(crop);
        listingsGrid.appendChild(cropCard);
    });
}

// Create crop card element
function createCropCard(crop) {
    const card = document.createElement('div');
    card.className = 'crop-card';
    card.innerHTML = `
        ${crop.immediate ? '<span class="crop-badge">Immediate</span>' : ''}
        <div class="crop-image ${crop.image}">
            <i class="${crop.icon}"></i>
        </div>
        <div class="crop-info">
            <h3>${crop.name}</h3>
            <div class="crop-meta">
                <span class="farmer">${crop.farmer}</span>
                <span class="location">${crop.location}</span>
            </div>
            <div class="crop-price">$${crop.price.toFixed(2)}/kg</div>
            <div class="crop-stats">
                <span class="quantity">${crop.quantity} kg available</span>
                <span class="rating">
                    <i class="fas fa-star"></i> ${crop.rating}
                </span>
            </div>
            <div class="crop-actions">
                <button class="btn-sm btn-outline view-details" data-crop-id="${crop.id}">
                    View Details
                </button>
                <button class="btn-sm btn-primary add-to-cart" data-crop-id="${crop.id}">
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    // Add event listeners to buttons
    const viewBtn = card.querySelector('.view-details');
    const addBtn = card.querySelector('.add-to-cart');

    viewBtn.addEventListener('click', () => showCropDetails(crop.id));
    addBtn.addEventListener('click', () => addToCart(crop.id));

    return card;
}

// Show crop details in modal
function showCropDetails(cropId) {
    const crop = sampleCrops.find(c => c.id === cropId);
    if (!crop) return;

    currentCrop = crop;
    
    const modal = document.getElementById('cropDetailModal');
    const modalCropName = document.getElementById('modalCropName');
    const modalCropImage = document.getElementById('modalCropImage');
    const modalPrice = document.getElementById('modalPrice');
    const modalQuantity = document.getElementById('modalQuantity');
    const modalHarvest = document.getElementById('modalHarvest');
    const modalRating = document.getElementById('modalRating');
    const modalFarmerAvatar = document.getElementById('modalFarmerAvatar');
    const modalFarmerName = document.getElementById('modalFarmerName');
    const modalFarmerLocation = document.getElementById('modalFarmerLocation');

    if (modalCropName) modalCropName.textContent = crop.name;
    if (modalCropImage) {
        modalCropImage.className = `image-placeholder ${crop.image}`;
        modalCropImage.innerHTML = `<i class="${crop.icon}"></i>`;
    }
    if (modalPrice) modalPrice.textContent = `$${crop.price.toFixed(2)}/kg`;
    if (modalQuantity) modalQuantity.textContent = `${crop.quantity} kg`;
    if (modalHarvest) modalHarvest.textContent = crop.immediate ? 'Immediate' : new Date(crop.harvestDate).toLocaleDateString();
    if (modalRating) {
        modalRating.innerHTML = generateStarRating(crop.rating);
    }
    if (modalFarmerAvatar) modalFarmerAvatar.textContent = crop.farmer.split(' ').map(n => n[0]).join('');
    if (modalFarmerName) modalFarmerName.textContent = crop.farmer;
    if (modalFarmerLocation) modalFarmerLocation.textContent = crop.location;

    // Setup quantity controls
    setupQuantityControls();

    modal.classList.add('active');
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }

    return stars;
}

// Setup quantity controls in modal
function setupQuantityControls() {
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const quantityInput = document.getElementById('orderQty');
    const totalPrice = document.getElementById('modalTotalPrice');

    if (!decreaseBtn || !increaseBtn || !quantityInput || !totalPrice) return;

    const updateTotalPrice = () => {
        const quantity = parseInt(quantityInput.value);
        const price = currentCrop ? currentCrop.price : 0;
        const total = quantity * price;
        totalPrice.textContent = `$${total.toFixed(2)}`;
    };

    decreaseBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
            updateTotalPrice();
        }
    });

    increaseBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        const maxQuantity = currentCrop ? currentCrop.quantity : 100;
        if (value < maxQuantity) {
            quantityInput.value = value + 1;
            updateTotalPrice();
        }
    });

    quantityInput.addEventListener('input', updateTotalPrice);
    updateTotalPrice();
}

// Add to cart from modal
document.getElementById('addToCartModal')?.addEventListener('click', function() {
    if (!currentCrop) return;

    const quantity = parseInt(document.getElementById('orderQty').value);
    addToCart(currentCrop.id, quantity);
    
    const modal = document.getElementById('cropDetailModal');
    modal.classList.remove('active');
});

// Add item to cart
function addToCart(cropId, quantity = 1) {
    const crop = sampleCrops.find(c => c.id === cropId);
    if (!crop) return;

    const existingItem = cart.find(item => item.cropId === cropId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            cropId: crop.id,
            name: crop.name,
            price: crop.price,
            quantity: quantity,
            image: crop.image,
            icon: crop.icon,
            farmer: crop.farmer
        });
    }

    updateCartUI();
    showNotification(`${crop.name} added to cart!`, 'success');
}

// Update cart UI
function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const totalAmount = document.querySelector('.total-amount');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartItems) return;

    // Update cart count
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image ${item.image}">
                    <i class="${item.icon}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-meta">${item.farmer}</div>
                    <div class="cart-item-controls">
                        <div class="cart-item-qty">
                            <button class="decrease-qty" data-crop-id="${item.cropId}">-</button>
                            <input type="number" value="${item.quantity}" min="1" class="item-qty" data-crop-id="${item.cropId}">
                            <button class="increase-qty" data-crop-id="${item.cropId}">+</button>
                        </div>
                        <button class="cart-item-remove" data-crop-id="${item.cropId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            `;
            cartItems.appendChild(cartItem);
        });

        // Add event listeners to cart item controls
        setupCartItemControls();
    }

    // Update total amount
    if (totalAmount) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalAmount.textContent = `$${total.toFixed(2)}`;
    }

    // Enable/disable checkout button
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

// Setup cart item controls
function setupCartItemControls() {
    // Quantity decrease
    document.querySelectorAll('.decrease-qty').forEach(btn => {
        btn.addEventListener('click', function() {
            const cropId = parseInt(this.dataset.cropId);
            updateCartQuantity(cropId, -1);
        });
    });

    // Quantity increase
    document.querySelectorAll('.increase-qty').forEach(btn => {
        btn.addEventListener('click', function() {
            const cropId = parseInt(this.dataset.cropId);
            updateCartQuantity(cropId, 1);
        });
    });

    // Quantity input
    document.querySelectorAll('.item-qty').forEach(input => {
        input.addEventListener('change', function() {
            const cropId = parseInt(this.dataset.cropId);
            const quantity = parseInt(this.value);
            if (quantity > 0) {
                setCartQuantity(cropId, quantity);
            }
        });
    });

    // Remove item
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const cropId = parseInt(this.dataset.cropId);
            removeFromCart(cropId);
        });
    });
}

// Update cart quantity
function updateCartQuantity(cropId, change) {
    const item = cart.find(item => item.cropId === cropId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            removeFromCart(cropId);
            return;
        }
        updateCartUI();
    }
}

// Set cart quantity
function setCartQuantity(cropId, quantity) {
    const item = cart.find(item => item.cropId === cropId);
    if (item) {
        item.quantity = quantity;
        updateCartUI();
    }
}

// Remove from cart
function removeFromCart(cropId) {
    cart = cart.filter(item => item.cropId !== cropId);
    updateCartUI();
    showNotification('Item removed from cart', 'warning');
}

// Handle checkout
function handleCheckout() {
    if (cart.length === 0) return;

    // In a real app, this would process the payment and create an order
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    showNotification(`Order placed successfully! Total: $${total.toFixed(2)}`, 'success');
    
    // Clear cart
    cart = [];
    updateCartUI();
    
    // Close cart sidebar
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.remove('active');
    }
}

// Handle sell crop form submission
function handleSellCrop(e) {
    e.preventDefault();
    
    // In a real app, this would send data to the backend
    const formData = new FormData(e.target);
    const cropData = Object.fromEntries(formData);
    
    showNotification('Crop listed successfully!', 'success');
    
    // Close modal and reset form
    const modal = document.getElementById('sellCropModal');
    if (modal) {
        modal.classList.remove('active');
    }
    e.target.reset();
}

// Filter listings based on current filters
function filterListings() {
    // Get current filter values
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const selectedTypes = Array.from(document.querySelectorAll('input[name="cropType"]:checked')).map(cb => cb.value);
    const location = document.getElementById('locationFilter')?.value || '';
    const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
    const harvestDate = document.querySelector('input[name="harvestDate"]:checked')?.value;
    const activeStars = document.querySelectorAll('.rating-filter .stars i.active');
    const minRating = activeStars.length;

    const filteredCrops = sampleCrops.filter(crop => {
        // Search filter
        if (searchTerm && !crop.name.toLowerCase().includes(searchTerm) && 
            !crop.farmer.toLowerCase().includes(searchTerm)) {
            return false;
        }

        // Crop type filter
        if (selectedTypes.length > 0 && !selectedTypes.includes(crop.type)) {
            return false;
        }

        // Location filter
        if (location && !crop.location.toLowerCase().includes(location)) {
            return false;
        }

        // Price filter
        if (crop.price < minPrice || crop.price > maxPrice) {
            return false;
        }

        // Harvest date filter
        if (harvestDate === 'immediate' && !crop.immediate) {
            return false;
        } else if (harvestDate === 'week') {
            const harvestDateObj = new Date(crop.harvestDate);
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            if (harvestDateObj > weekFromNow) {
                return false;
            }
        } else if (harvestDate === 'month') {
            const harvestDateObj = new Date(crop.harvestDate);
            const monthFromNow = new Date();
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            if (harvestDateObj > monthFromNow) {
                return false;
            }
        }

        // Rating filter
        if (crop.rating < minRating) {
            return false;
        }

        return true;
    });

    displayFilteredListings(filteredCrops);
}

// Display filtered listings
function displayFilteredListings(crops) {
    const listingsGrid = document.getElementById('listingsGrid');
    if (!listingsGrid) return;

    listingsGrid.innerHTML = '';
    
    if (crops.length === 0) {
        listingsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No crops found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }

    crops.forEach(crop => {
        const cropCard = createCropCard(crop);
        listingsGrid.appendChild(cropCard);
    });
}

// Sort listings
function sortListings(sortBy) {
    let sortedCrops = [...sampleCrops];

    switch (sortBy) {
        case 'price-low':
            sortedCrops.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedCrops.sort((a, b) => b.price - a.price);
            break;
        case 'popular':
            sortedCrops.sort((a, b) => b.rating - a.rating);
            break;
        case 'rating':
            sortedCrops.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
        default:
            // Keep original order for newest
            break;
    }

    displayFilteredListings(sortedCrops);
}

// Clear all filters
function clearAllFilters() {
    // Reset checkboxes
    document.querySelectorAll('input[name="cropType"]').forEach(cb => {
        cb.checked = true;
    });

    // Reset location
    document.getElementById('locationFilter').value = '';

    // Reset price
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('priceRange').value = 250;

    // Reset harvest date
    document.querySelector('input[name="harvestDate"][value="immediate"]').checked = true;

    // Reset rating
    setRatingFilter(0);

    // Reset search
    document.getElementById('searchInput').value = '';

    filterListings();
}

// Load more listings (simulated)
function loadMoreListings() {
    // In a real app, this would fetch more data from the server
    showNotification('Loading more listings...', 'info');
    
    // Simulate API call delay
    setTimeout(() => {
        showNotification('More listings loaded!', 'success');
    }, 1000);
}

// Initialize charts
function initializeCharts() {
    // Price Trend Chart
    const priceTrendCtx = document.getElementById('priceTrendChart');
    if (priceTrendCtx) {
        new Chart(priceTrendCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Average Price ($/kg)',
                    data: [2.1, 2.2, 2.15, 2.3, 2.25, 2.2, 2.15],
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
                }
            }
        });
    }

    // Orders Chart
    const ordersCtx = document.getElementById('ordersChart');
    if (ordersCtx) {
        new Chart(ordersCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Orders',
                    data: [45, 52, 48, 65, 58, 62, 70],
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
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

// Get notification icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'error': return 'times-circle';
        default: return 'info-circle';
    }
}

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 15px 20px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        border-left: 4px solid #4caf50;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        max-width: 300px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left-color: #4caf50;
    }
    
    .notification-warning {
        border-left-color: #ff9800;
    }
    
    .notification-info {
        border-left-color: #2196f3;
    }
    
    .notification-error {
        border-left-color: #f44336;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
    
    .notification-success i { color: #4caf50; }
    .notification-warning i { color: #ff9800; }
    .notification-info i { color: #2196f3; }
    .notification-error i { color: #f44336; }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);