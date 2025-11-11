# Frontend Integration Plan

## Overview

This document outlines how to integrate the Edge Functions API with the frontend pages. The frontend will call Edge Functions using JWT tokens stored in sessionStorage, handle demo mode toggle, and display empty states with CTAs.

---

## 1. Session Storage Keys

The login flow (already implemented in `public/src/js/login.js`) populates:

- **`sessionToken`** - JWT access token string (stored after successful login)
- **`currentUser`** - JSON stringified user profile object

### Example Storage:
```javascript
sessionStorage.setItem('sessionToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
sessionStorage.setItem('currentUser', JSON.stringify({
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'john@example.com',
  role: 'farmer'
}));
```

---

## 2. API Base URL

All Edge Functions are hosted at:
```
https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/<function-name>
```

Example:
```
https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-dashboard
```

---

## 3. Making API Calls

### Standard Fetch Pattern

```javascript
async function callEdgeFunction(functionName, limit = 5) {
  const token = sessionStorage.getItem('sessionToken');
  
  if (!token) {
    console.error('No session token found');
    window.location.href = 'login.html';
    return null;
  }

  const url = `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/${functionName}?limit=${limit}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Unauthorized - redirect to login
      sessionStorage.clear();
      window.location.href = 'login.html';
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}
```

### Example: Fetch Dashboard Data

```javascript
async function loadDashboard() {
  const result = await callEdgeFunction('get-dashboard', 5);
  
  if (!result || !result.success) {
    console.error('Failed to load dashboard:', result?.error);
    return;
  }

  const { data, demo } = result;
  
  // Check demo mode
  const demoMode = localStorage.getItem('demoMode') === 'on';
  
  // Display profile
  displayProfile(data.profile);
  
  // Display counts
  displayCounts(data.counts);
  
  // Display crops (use demo if empty and demo mode ON)
  const cropsToShow = (data.recent_crops.length === 0 && demoMode) 
    ? [demo.crop] 
    : data.recent_crops;
  displayCrops(cropsToShow);
  
  // Display listings (use demo if empty and demo mode ON)
  const listingsToShow = (data.recent_listings.length === 0 && demoMode) 
    ? [demo.listing] 
    : data.recent_listings;
  displayListings(listingsToShow);
}
```

---

## 4. Demo Mode Toggle

### localStorage Key
- **Key**: `demoMode`
- **Values**: `'on'` or `'off'` (default: `'off'`)

### Toggle Implementation

```javascript
// Toggle demo mode
function toggleDemoMode() {
  const currentMode = localStorage.getItem('demoMode');
  const newMode = currentMode === 'on' ? 'off' : 'on';
  localStorage.setItem('demoMode', newMode);
  
  // Reload page data
  loadPageData();
  
  // Update UI
  updateDemoToggleUI(newMode);
}

// Check demo mode status
function isDemoModeOn() {
  return localStorage.getItem('demoMode') === 'on';
}

// Initialize demo toggle UI
function initDemoToggle() {
  const toggle = document.getElementById('demo-mode-toggle');
  const isOn = isDemoModeOn();
  
  if (toggle) {
    toggle.checked = isOn;
    toggle.addEventListener('change', toggleDemoMode);
  }
}
```

### HTML Toggle Element (add to each page)

```html
<div class="demo-mode-toggle">
  <label>
    <input type="checkbox" id="demo-mode-toggle">
    <span>Demo Mode</span>
  </label>
</div>
```

---

## 5. DOM Mapping Rules

### Dashboard Page (`index.html`)

#### Profile Section
- **Selector**: `#user-greeting` or `.user-profile`
- **Update**: Display `data.profile.first_name` and `data.profile.last_name`
- **Example**: `Welcome back, ${data.profile.first_name}!`

#### Counts Section
- **Selector**: `#farms-count`, `#crops-count`, `#inventory-count`, `#listings-count`
- **Update**: Display `data.counts.farms_count`, `data.counts.crops_count`, etc.

#### Recent Crops Section
- **Selector**: `#recent-crops` or `.crops-list`
- **Update**: Loop through `data.recent_crops` (or `demo.crop` if empty and demo mode ON)
- **Render**: Create crop cards with crop_name, farm_name, status, area

#### Recent Listings Section
- **Selector**: `#recent-listings` or `.listings-list`
- **Update**: Loop through `data.recent_listings` (or `demo.listing` if empty and demo mode ON)
- **Render**: Create listing cards with crop_name, price_per_unit, available_qty

### Farms Page (`fields.html`)

#### Farms List
- **Selector**: `#farms-list` or `.farms-container`
- **Update**: Loop through `data` array from `/get-farms`
- **Render**: Farm cards with farm_name, area, soil_type, crop_type

### Crops Page (`crops.html`)

#### Crops List
- **Selector**: `#crops-list` or `.crops-container`
- **Update**: Loop through `data` array from `/get-crops`
- **Render**: Crop cards with crop_name, farm_name, sowing_date, expected_harvest, status

### Inventory Page (`inventory.html`)

#### Inventory List
- **Selector**: `#inventory-list` or `.inventory-container`
- **Update**: Loop through `data` array from `/get-inventory`
- **Render**: Inventory cards with input_name, category, quantity, unit, farm_name

### Marketplace Page (`marketplace.html`)

#### Listings List
- **Selector**: `#listings-list` or `.marketplace-container`
- **Update**: Loop through `data` array from `/get-listings`
- **Render**: Listing cards with crop_name, farm_name, price_per_unit, available_qty, seller_name (if buyer)

---

## 6. Empty State Behavior

### Empty State with CTA Card

When `data.length === 0` and demo mode is OFF:

1. **Show CTA Card** with link to add page:
   - Farms page → Link to `farms.html` (add farm form)
   - Crops page → Link to `crops.html` (add crop form)
   - Inventory page → Link to `inventory.html` (add inventory form)
   - Marketplace page → Link to `marketplace.html` (create listing form)

2. **Show Demo Preview Card** (always visible, even when empty):
   - Display demo item from `response.demo`
   - Label: "This is a demo preview — toggle Demo Mode ON to show more samples."
   - Include toggle button/link

### Example Empty State HTML

```html
<div class="empty-state">
  <div class="cta-card">
    <h3>No farms yet</h3>
    <p>Get started by adding your first farm.</p>
    <a href="fields.html" class="btn-primary">Add Farm</a>
  </div>
  
  <div class="demo-preview-card">
    <h4>Demo Preview</h4>
    <p>This is a demo preview — toggle Demo Mode ON to show more samples.</p>
    <div class="demo-item">
      <!-- Render demo item from response.demo -->
    </div>
    <button onclick="toggleDemoMode()" class="btn-secondary">Enable Demo Mode</button>
  </div>
</div>
```

### Empty State with Demo Mode ON

When `data.length === 0` and demo mode is ON:

1. **Hide CTA Card** (or show minimized version)
2. **Show Demo Items** from `response.demo`
3. **Display message**: "Showing demo data. Add your first item to see real data."

---

## 7. Error Handling

### 401 Unauthorized
- Clear sessionStorage
- Redirect to `login.html`

### 404 Not Found
- Show error message: "Resource not found"
- Optionally redirect to dashboard

### 500 Server Error
- Show error message: "Server error. Please try again later."
- Log error to console

### Network Error
- Show error message: "Network error. Check your connection."
- Provide retry button

### Example Error Handler

```javascript
function handleApiError(error, response) {
  if (response?.status === 401) {
    sessionStorage.clear();
    window.location.href = 'login.html';
    return;
  }
  
  const errorMessage = error?.message || 'An error occurred';
  showErrorMessage(errorMessage);
}

function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => errorDiv.remove(), 5000);
}
```

---

## 8. Page-Specific Integration

### Dashboard (`index.html`)

```javascript
// In public/src/js/index.js
async function loadDashboard() {
  const result = await callEdgeFunction('get-dashboard', 5);
  
  if (!result?.success) {
    handleApiError(null, result);
    return;
  }
  
  const { data, demo } = result;
  const demoMode = isDemoModeOn();
  
  // Update profile
  document.getElementById('user-greeting').textContent = 
    `Welcome back, ${data.profile.first_name}!`;
  
  // Update counts
  document.getElementById('farms-count').textContent = data.counts.farms_count;
  document.getElementById('crops-count').textContent = data.counts.crops_count;
  document.getElementById('inventory-count').textContent = data.counts.inventory_count;
  document.getElementById('listings-count').textContent = data.counts.listings_count;
  
  // Update crops
  const cropsContainer = document.getElementById('recent-crops');
  const cropsToShow = (data.recent_crops.length === 0 && demoMode) 
    ? [demo.crop] 
    : data.recent_crops;
  renderCrops(cropsToShow, cropsContainer);
  
  // Update listings
  const listingsContainer = document.getElementById('recent-listings');
  const listingsToShow = (data.recent_listings.length === 0 && demoMode) 
    ? [demo.listing] 
    : data.recent_listings;
  renderListings(listingsToShow, listingsContainer);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initDemoToggle();
  loadDashboard();
});
```

### Farms Page (`fields.html`)

```javascript
// In public/src/js/fields.js
async function loadFarms() {
  const result = await callEdgeFunction('get-farms', 5);
  
  if (!result?.success) {
    handleApiError(null, result);
    return;
  }
  
  const { data, demo } = result;
  const demoMode = isDemoModeOn();
  const farmsContainer = document.getElementById('farms-list');
  
  if (data.length === 0) {
    if (demoMode) {
      renderFarms([demo.farm], farmsContainer);
      showMessage('Showing demo data. Add your first farm to see real data.');
    } else {
      showEmptyState(farmsContainer, 'fields.html', demo.farm);
    }
  } else {
    renderFarms(data, farmsContainer);
  }
}
```

### Similar pattern for:
- Crops page → `callEdgeFunction('get-crops', 5)`
- Inventory page → `callEdgeFunction('get-inventory', 5)`
- Marketplace page → `callEdgeFunction('get-listings', 5)`

---

## 9. Search Integration

### Search Endpoint Usage

```javascript
async function searchCropsAndListings(query, limit = 20) {
  const token = sessionStorage.getItem('sessionToken');
  const url = `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const result = await response.json();
  return result;
}

// Usage
const searchResults = await searchCropsAndListings('maize', 20);
if (searchResults.success) {
  renderCrops(searchResults.data.crops, cropsContainer);
  renderListings(searchResults.data.listings, listingsContainer);
}
```

---

## 10. Profile Integration

### Load User Profile

```javascript
async function loadProfile() {
  const result = await callEdgeFunction('get-profile');
  
  if (!result?.success) {
    handleApiError(null, result);
    return;
  }
  
  const profile = result.data;
  
  // Update profile UI
  document.getElementById('profile-name').textContent = 
    `${profile.first_name} ${profile.last_name}`;
  document.getElementById('profile-email').textContent = profile.email;
  document.getElementById('profile-phone').textContent = profile.phone_number || 'N/A';
  document.getElementById('profile-address').textContent = profile.address || 'N/A';
  document.getElementById('profile-role').textContent = profile.role;
  
  if (profile.profile_picture) {
    document.getElementById('profile-picture').src = profile.profile_picture;
  }
}
```

---

## 11. CSS Classes for Styling

### Recommended CSS Classes

```css
/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.cta-card {
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.demo-preview-card {
  background: #fff3cd;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #ffc107;
}

/* Demo mode toggle */
.demo-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Error messages */
.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}
```

---

## 12. Testing Checklist

- [ ] Dashboard loads profile and counts correctly
- [ ] Demo mode toggle works and persists in localStorage
- [ ] Empty states show CTA cards when demo mode is OFF
- [ ] Demo items show when demo mode is ON
- [ ] All pages handle 401 errors and redirect to login
- [ ] Search function works with query parameter
- [ ] Profile page displays user data correctly
- [ ] Buyer role sees seller_name in listings
- [ ] Farmer role sees only their own listings
- [ ] Limit parameter works (default 5, max 50)

---

## 13. Implementation Order

1. **Create shared API utility** (`public/src/js/api.js`)
   - `callEdgeFunction()` function
   - Error handling
   - Token management

2. **Create demo mode utility** (`public/src/js/demo-mode.js`)
   - Toggle function
   - Check function
   - UI update function

3. **Update each page JavaScript**:
   - Dashboard (`index.js`)
   - Farms (`fields.js`)
   - Crops (`crops.js`)
   - Inventory (`inventory.js`)
   - Marketplace (`marketplace.js`)

4. **Add demo mode toggle UI** to each page

5. **Add empty state UI** to each page

6. **Test all endpoints** with Postman first

7. **Test frontend integration** in browser

---

## 14. Example Complete Integration

See `public/src/js/api.js` (to be created) for the complete API utility that handles all Edge Function calls, error handling, and token management.

