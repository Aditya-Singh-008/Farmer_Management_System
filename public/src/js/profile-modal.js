// Shared profile modal + logout handling across pages
(function initProfileModal() {
  const summaryFields = [
    { key: 'first_name', label: 'First name' },
    { key: 'last_name', label: 'Last name' },
    { key: 'phone_number', label: 'Phone number' },
    { key: 'address_line1', label: 'Address line 1' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' }
  ];

  const modalMarkup = `
    <div id="profileModal" class="modal hidden profile-modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="profileModalTitle">Profile Details</h2>
                <button type="button" id="closeProfileModal" class="modal-close" aria-label="Close profile modal">&times;</button>
            </div>
            <p id="profileMessage" class="modal-message" aria-live="polite"></p>
            <div id="profileSummary" class="profile-summary">
                <div class="summary-grid" id="profileSummaryGrid"></div>
                <p id="profileMissing" class="summary-missing" aria-live="polite"></p>
                <button type="button" id="profileEditBtn" class="action-btn secondary">Update profile details</button>
            </div>
            <div id="profileEditPanel" class="profile-edit-panel hidden">
                <form id="profileForm" class="profile-form-grid">
                    <input type="hidden" id="profile_id" name="profile_id">
                    <input type="hidden" id="user_id" name="user_id">
                    <input type="hidden" id="auth_user_id" name="auth_user_id">
                    <input type="hidden" id="app_user_id" name="app_user_id">
                    <label>First name
                        <input type="text" id="first_name" name="first_name" required>
                    </label>
                    <label>Last name
                        <input type="text" id="last_name" name="last_name" required>
                    </label>
                    <label>Phone number
                        <input type="tel" id="phone_number" name="phone_number" maxlength="15">
                    </label>
                    <label>Address line 1
                        <input type="text" id="address_line1" name="address_line1">
                    </label>
                    <label>Address line 2
                        <input type="text" id="address_line2" name="address_line2">
                    </label>
                    <label>City
                        <input type="text" id="city" name="city">
                    </label>
                    <label>State
                        <input type="text" id="state" name="state">
                    </label>
                    <label>Postal code
                        <input type="text" id="postal_code" name="postal_code" maxlength="15">
                    </label>
                    <label>Country
                        <input type="text" id="country" name="country">
                    </label>
                    <label>Date of birth
                        <input type="date" id="dob" name="dob">
                    </label>
                    <label>Gender
                        <select id="gender" name="gender">
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </label>
                    <label>Profile picture (URL)
                        <input type="url" id="profile_picture" name="profile_picture" placeholder="https://...">
                    </label>
                    <div class="modal-actions">
                        <button type="button" id="cancelProfileBtn">Cancel</button>
                        <button type="submit" id="saveProfileBtn">Save profile</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  `;

  const ensureModalMarkup = () => {
    if (document.getElementById('profileModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    const modalNode = wrapper.firstElementChild;
    if (modalNode) {
      document.body.appendChild(modalNode);
    }
  };

  const setProfileMessage = (type, text) => {
    const messageEl = document.getElementById('profileMessage');
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `modal-message ${type || ''}`.trim();
  };

  const renderProfileSummary = (profile) => {
    const summaryGrid = document.getElementById('profileSummaryGrid');
    const summaryMissing = document.getElementById('profileMissing');
    if (!summaryGrid || !summaryMissing) return;

    summaryGrid.innerHTML = summaryFields
      .map((field) => {
        const value = profile[field.key] || '—';
        return `
          <div class="summary-item">
            <span class="summary-label">${field.label}</span>
            <span class="summary-value">${value}</span>
          </div>
        `;
      })
      .join('');

    const missing = summaryFields.filter((field) => !profile[field.key]).map((f) => f.label);
    if (missing.length) {
      summaryMissing.textContent = `Missing fields: ${missing.join(', ')}`;
      setProfileMessage('warning', 'Some profile details are missing. Tap update to complete them.');
    } else {
      summaryMissing.textContent = 'All essential profile details are complete.';
      setProfileMessage('', '');
    }
  };

  const showSummaryView = () => {
    document.getElementById('profileSummary')?.classList.remove('hidden');
    document.getElementById('profileEditPanel')?.classList.add('hidden');
  };

  const showEditView = () => {
    document.getElementById('profileSummary')?.classList.add('hidden');
    document.getElementById('profileEditPanel')?.classList.remove('hidden');
  };

  const hideProfileModal = () => {
    document.getElementById('profileModal')?.classList.add('hidden');
    setProfileMessage('', '');
    showSummaryView();
  };

  const getCurrentProfile = () => window.currentProfile || {};

  const applyProfileToHeader = (profile = {}) => {
    const firstName = profile.first_name || 'Farmer';
    const lastName = profile.last_name || '';
    const initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase() || 'FJ';

    document.querySelectorAll('.user-name').forEach((el) => {
      el.textContent = firstName;
    });
    document.querySelectorAll('#greeting').forEach((el) => {
      el.textContent = `Good Morning, ${firstName}`;
    });
    document.querySelectorAll('#greeting-sub').forEach((el) => {
      if (!el.textContent) el.textContent = "Here's your farm overview for today";
    });
    document.querySelectorAll('#avatar, .avatar').forEach((el) => {
      if (profile.profile_picture) {
        el.style.backgroundImage = `url('${profile.profile_picture}')`;
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.textContent = initials;
      }
    });
  };

  const populateFormFromProfile = () => {
    const profile = getCurrentProfile();
    const fields = [
      'profile_id',
      'user_id',
      'first_name',
      'last_name',
      'phone_number',
      'address_line1',
      'address_line2',
      'city',
      'state',
      'postal_code',
      'country',
      'dob',
      'gender',
      'profile_picture'
    ];
    fields.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      const variations = [
        profile[key],
        profile[key?.replace(/_/g, ' ')],
        profile[key?.replace(/_/g, '')],
        profile[key?.replace(/ /g, '_')],
        profile[key?.toLowerCase()]
      ];
      el.value = (variations.find((val) => typeof val !== 'undefined' && val !== null) || '') ?? '';
    });

    const storedAuthId =
      sessionStorage.getItem('authUserId') || profile.auth_user_id || profile.user_id || '';
    const storedAppId = sessionStorage.getItem('appUserId') || profile.user_id || '';
    const authInput = document.getElementById('auth_user_id');
    const userIdInput = document.getElementById('user_id');
    const appIdInput = document.getElementById('app_user_id');
    if (authInput) authInput.value = storedAuthId || '';
    if (userIdInput) userIdInput.value = storedAuthId || '';
    if (appIdInput) appIdInput.value = storedAppId || '';

    renderProfileSummary(profile);
    applyProfileToHeader(profile);
  };

  const handleLogout = async () => {
    try {
      if (typeof window.signOut === 'function') {
        await window.signOut();
      } else if (window.supabase?.auth?.signOut) {
        await window.supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('authUserId');
      sessionStorage.removeItem('appUserId');
      localStorage.removeItem('rememberedEmail');
      window.location.href = 'login.html';
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const profile = getCurrentProfile();
    const authInput = document.getElementById('auth_user_id');
    const appInput = document.getElementById('app_user_id');
    const resolvedAuthId =
      (authInput?.value || '').trim() ||
      sessionStorage.getItem('authUserId') ||
      profile.auth_user_id ||
      profile.user_id ||
      null;
    const resolvedAppId =
      (appInput?.value || '').trim() ||
      sessionStorage.getItem('appUserId') ||
      profile.user_id ||
      null;

    const payload = {
      profile_id: document.getElementById('profile_id')?.value || null,
      user_id: resolvedAuthId,
      auth_user_id: resolvedAuthId,
      app_user_id: resolvedAppId,
      first_name: document.getElementById('first_name')?.value || '',
      last_name: document.getElementById('last_name')?.value || '',
      phone_number: document.getElementById('phone_number')?.value || '',
      address_line1: document.getElementById('address_line1')?.value || '',
      address_line2: document.getElementById('address_line2')?.value || '',
      city: document.getElementById('city')?.value || '',
      state: document.getElementById('state')?.value || '',
      postal_code: document.getElementById('postal_code')?.value || '',
      country: document.getElementById('country')?.value || '',
      dob: document.getElementById('dob')?.value || null,
      gender: document.getElementById('gender')?.value || '',
      profile_picture: document.getElementById('profile_picture')?.value || ''
    };

    if (!payload.first_name || !payload.last_name) {
      setProfileMessage('error', 'First and last name are required.');
      return;
    }

    try {
      setProfileMessage('saving', 'Saving profile...');
      let result = null;
      if (window.FarmerAPI?.saveProfileDetails) {
        result = await window.FarmerAPI.saveProfileDetails(payload);
      }
      if (result?.success && result.data) {
        const savedProfile = result.data;
        window.currentProfile = { ...(window.currentProfile || {}), ...savedProfile };
        if (savedProfile.user_id) sessionStorage.setItem('appUserId', savedProfile.user_id);
        if (savedProfile.auth_user_id) sessionStorage.setItem('authUserId', savedProfile.auth_user_id);
        populateFormFromProfile();
        showSummaryView();
        setProfileMessage('success', 'Profile updated.');

        applyProfileToHeader(savedProfile);

        if (savedProfile.city && typeof window.updateWeatherFromCity === 'function') {
          window.updateWeatherFromCity(savedProfile.city);
        }

        setTimeout(() => hideProfileModal(), 900);
      } else {
        const errorMsg = result?.error || 'Failed to update profile.';
        setProfileMessage('error', errorMsg);
      }
    } catch (error) {
      console.error('Error updating profile', error);
      setProfileMessage('error', 'Error saving profile. Please try again.');
    }
  };

  const ensureProfileLoaded = async () => {
    if (window.currentProfile && Object.keys(window.currentProfile).length) return;
    if (!window.FarmerAPI?.getProfile) return;
    try {
      const response = await window.FarmerAPI.getProfile();
      if (response?.success && response.data) {
        window.currentProfile = response.data;
        populateFormFromProfile();
        applyProfileToHeader(response.data);
        if (response.data.auth_user_id) sessionStorage.setItem('authUserId', response.data.auth_user_id);
        if (response.data.user_id) sessionStorage.setItem('appUserId', response.data.user_id);
      }
    } catch (error) {
      console.warn('Unable to load profile for modal', error);
    }
  };

  const initProfileUI = () => {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');
    const openProfileBtn = document.getElementById('openProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (!userMenuBtn || !userMenu || !logoutBtn) return;

    ensureModalMarkup();
    ensureProfileLoaded();

    const profileModal = document.getElementById('profileModal');
    const profileForm = document.getElementById('profileForm');
    const profileEditBtn = document.getElementById('profileEditBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const closeProfileModalBtn = document.getElementById('closeProfileModal');

    userMenuBtn.addEventListener('click', () => {
      const expanded = userMenuBtn.getAttribute('aria-expanded') === 'true';
      userMenuBtn.setAttribute('aria-expanded', String(!expanded));
      userMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
      const wrapper = document.getElementById('user-profile-wrapper');
      if (wrapper && !wrapper.contains(event.target)) {
        userMenu.classList.add('hidden');
        userMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    profileModal?.addEventListener('click', (event) => {
      if (event.target === profileModal) {
        hideProfileModal();
      }
    });

    if (openProfileBtn) {
      openProfileBtn.addEventListener('click', () => {
        userMenu.classList.add('hidden');
        userMenuBtn.setAttribute('aria-expanded', 'false');
        populateFormFromProfile();
        showSummaryView();
        document.getElementById('profileModal')?.classList.remove('hidden');
      });
    }

    profileEditBtn?.addEventListener('click', showEditView);
    cancelProfileBtn?.addEventListener('click', hideProfileModal);
    closeProfileModalBtn?.addEventListener('click', hideProfileModal);
    profileForm?.addEventListener('submit', handleProfileSave);
    logoutBtn.addEventListener('click', handleLogout);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hideProfileModal();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileUI);
  } else {
    initProfileUI();
  }
})();
