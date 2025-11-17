// Dynamic crop management page
(function initCropsPage() {
  const state = {
    crops: [],
    farms: [],
    selectedCropId: null,
    loading: false
  };

  const DAY_MS = 1000 * 60 * 60 * 24;
  const SOIL_YIELD_FACTORS = {
    loamy: 3.8,
    clay: 2.7,
    sandy: 2.1,
    silt: 3.3,
    peat: 2.5,
    chalky: 1.9,
    black: 4.0,
    laterite: 2.2
  };
  const DEFAULT_YIELD_FACTOR = 2.5;
  const MIN_AREA_FOR_YIELD = 0.1;

  const normalizeSoilType = (value) => (value ? value.toString().trim().toLowerCase() : '');

  const formatSoilLabel = (value) => {
    if (!value) return '—';
    return value
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getYieldFactorForSoil = (soil) => {
    const key = normalizeSoilType(soil);
    return key && SOIL_YIELD_FACTORS[key] ? SOIL_YIELD_FACTORS[key] : DEFAULT_YIELD_FACTOR;
  };

  const calculateExpectedYield = (area, soil) => {
    const numericArea = Number(area);
    if (Number.isNaN(numericArea) || numericArea < MIN_AREA_FOR_YIELD) return null;
    const factor = getYieldFactorForSoil(soil);
    return Number((numericArea * factor).toFixed(1));
  };

  const deriveStatusFromTimeline = (sowingDate, harvestDate) => {
    if (!sowingDate) return '';
    const sow = new Date(sowingDate);
    if (Number.isNaN(sow.getTime())) return '';
    const today = new Date();
    const now = today.getTime();
    const sowTime = sow.getTime();
    if (harvestDate) {
      const harvest = new Date(harvestDate);
      if (!Number.isNaN(harvest.getTime())) {
        const harvestTime = harvest.getTime();
        if (now > harvestTime) return 'completed';
        const totalWindow = harvestTime - sowTime;
        const elapsed = now - sowTime;
        if (totalWindow > 0 && elapsed >= 0) {
          const progress = elapsed / totalWindow;
          if (progress < 0.2) return 'planted';
          if (progress < 0.65) return 'growing';
          if (progress < 0.9) return 'flowering';
          return 'harvest';
        }
      }
    }
    const daysSinceSow = Math.floor((now - sowTime) / DAY_MS);
    if (daysSinceSow < 0) return 'scheduled';
    if (daysSinceSow < 30) return 'planted';
    if (daysSinceSow < 80) return 'growing';
    if (daysSinceSow < 120) return 'flowering';
    return 'monitor';
  };

  const summaryEls = {
    total: document.getElementById('summaryTotal'),
    totalStatus: document.getElementById('summaryTotalStatus'),
    ready: document.getElementById('summaryReady'),
    readyStatus: document.getElementById('summaryReadyStatus'),
    attention: document.getElementById('summaryAttention'),
    attentionStatus: document.getElementById('summaryAttentionStatus')
  };

  const listEl = document.getElementById('cropsList');
  const listMetaEl = document.getElementById('cropListMeta');
  const detailEl = document.getElementById('cropDetail');
  const detailEmptyEl = document.getElementById('cropDetailEmpty');

  const addModal = document.getElementById('addCropModal');
  const addForm = document.getElementById('addCropForm');
  const farmSelect = document.getElementById('cropFarmSelect');
  const cancelAddBtn = document.getElementById('cancelAddCropBtn');
  const closeAddBtn = document.getElementById('closeAddCropModal');
  const openAddBtn = document.getElementById('openAddCropBtn');
  const refreshBtn = document.getElementById('refreshCropsBtn');
  const manageFieldsBtn = document.getElementById('manageFieldsBtn');

  const showNotification = (msg, type = 'error') => {
    if (type === 'success' && window.FarmerAPI?.showSuccessMessage) {
      window.FarmerAPI.showSuccessMessage(msg);
      return;
    }
    if (type !== 'success' && window.FarmerAPI?.showErrorMessage) {
      window.FarmerAPI.showErrorMessage(msg);
      return;
    }
    alert(msg);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const normalizeCrop = (raw) => {
    if (!raw) return null;
    const farmId = raw.farm_id || raw.farms?.farm_id || raw.farm?.farm_id || null;
    const farmContext = farmId ? getFarmById(farmId) : null;
    const areaValue =
      raw.area != null
        ? Number(raw.area)
        : raw.field_area != null
        ? Number(raw.field_area)
        : farmContext?.area != null
        ? Number(farmContext.area)
        : null;
    const resolvedSoil = normalizeSoilType(raw.soil_type || raw.soilType || farmContext?.soil_type);
    const soilDisplay = resolvedSoil ? formatSoilLabel(resolvedSoil) : null;
    const derivedStatus = deriveStatusFromTimeline(raw.sowing_date || raw.planting_date, raw.expected_harvest || raw.harvest_date);
    const fallbackStatus = raw.status || 'planted';
    const finalStatus = derivedStatus || fallbackStatus;
    const estimatedYield = calculateExpectedYield(areaValue, resolvedSoil);

    return {
      id: raw.crop_id || raw.id,
      farm_id: farmId,
      farm_name:
        raw.farm_name ||
        raw.farm?.farm_name ||
        (raw.farms ? raw.farms.farm_name : null) ||
        (farmContext ? farmContext.farm_name : raw.farm_id ? getFarmName(raw.farm_id) : 'Field'),
      crop_name: raw.crop_name || raw.name || 'Unnamed crop',
      crop_type: raw.crop_type || raw.type || '—',
      sowing_date: raw.sowing_date || raw.planting_date || null,
      expected_harvest: raw.expected_harvest || raw.harvest_date || null,
      area: areaValue,
      soil_type: resolvedSoil || null,
      soil_display: soilDisplay,
      status: finalStatus,
      status_source: derivedStatus ? 'timeline' : 'stored',
      estimated_yield: estimatedYield,
      created_at: raw.created_at || null,
      updated_at: raw.updated_at || null,
      notes: raw.notes || raw.description || '',
      report: raw.report || raw.crop_reports || null
    };
  };

  const getFarmById = (farmId) => state.farms.find((farm) => String(farm.farm_id) === String(farmId));

  const getFarmName = (farmId) => {
    const match = getFarmById(farmId);
    return match ? match.farm_name || `Field ${match.farm_id}` : 'Field';
  };

  const getSoilTypeForCrop = (crop) => {
    if (!crop) return '—';
    if (crop.soil_display) return crop.soil_display;
    if (crop.soil_type) return formatSoilLabel(crop.soil_type);
    const farm = getFarmById(crop.farm_id);
    return formatSoilLabel(farm?.soil_type || '');
  };

  const setLoading = (isLoading) => {
    state.loading = isLoading;
    if (listMetaEl) {
      listMetaEl.textContent = isLoading ? 'Loading crops...' : `${state.crops.length} crop(s) loaded`;
    }
    if (isLoading && listEl) {
      listEl.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <h3>Loading Crops</h3>
          <p>Fetching your crop information...</p>
        </div>
      `;
    }
  };

  const renderSummary = () => {
    const total = state.crops.length;
    const today = new Date();
    const ready = state.crops.filter((crop) => {
      if (!crop.expected_harvest) return false;
      const harvest = new Date(crop.expected_harvest);
      if (Number.isNaN(harvest.getTime())) return false;
      const diffDays = Math.round((harvest - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= -7;
    }).length;
    const attention = state.crops.filter((crop) => {
      const status = String(crop.status || '').toLowerCase();
      return status.includes('issue') || status.includes('disease') || status.includes('pest');
    }).length;

    const applyBadge = (el, iconClass, text) => {
      if (!el) return;
      el.innerHTML = `<i class="${iconClass}"></i> ${text}`;
    };

    if (summaryEls.total) summaryEls.total.textContent = total;
    applyBadge(summaryEls.totalStatus, 'fas fa-seedling', total ? 'Tracked' : 'No data');
    if (summaryEls.ready) summaryEls.ready.textContent = ready;
    applyBadge(summaryEls.readyStatus, 'fas fa-clock', ready ? 'Within a week' : 'None');
    if (summaryEls.attention) summaryEls.attention.textContent = attention;
    applyBadge(summaryEls.attentionStatus, 'fas fa-exclamation-triangle', attention ? 'Check fields' : 'All good');
  };

  const renderCropsList = () => {
    if (!listEl) return;
    if (!state.crops.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-leaf"></i>
          <h3>No crops found</h3>
          <p>Use the Add Crop button to register your plantings.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = state.crops
      .map((crop) => {
        const active = crop.id === state.selectedCropId ? 'active' : '';
        const status = (crop.status || 'planted').toString();
        const metaParts = [crop.farm_name || 'Field', crop.crop_type || '—'];
        if (crop.estimated_yield) {
          metaParts.push(`Est. ${crop.estimated_yield} t`);
        }
        return `
            <button class="crop-row ${active}" data-crop-id="${crop.id}">
                <div>
                    <p class="crop-name">${crop.crop_name}</p>
                    <p class="crop-meta">${metaParts.join(' • ')}</p>
                </div>
                <div class="crop-row-right">
                    <span class="status-badge ${status.toLowerCase()}">${status}</span>
                    <span class="crop-date">${formatDate(crop.sowing_date)}</span>
                </div>
            </button>
        `;
      })
      .join('');

    listEl.querySelectorAll('[data-crop-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-crop-id');
        selectCrop(id);
      });
    });
  };

  const renderCropDetails = () => {
    if (!detailEl || !detailEmptyEl) return;
    const crop = state.crops.find((c) => String(c.id) === String(state.selectedCropId));
    if (!crop) {
      detailEl.classList.add('hidden');
      detailEmptyEl.classList.remove('hidden');
      return;
    }

    detailEmptyEl.classList.add('hidden');
    detailEl.classList.remove('hidden');

    const detailHtml = `
        <div class="detail-header">
            <div>
                <p class="detail-kicker">${crop.crop_type || 'Crop'}</p>
                <h2>${crop.crop_name}</h2>
                <p class="detail-field">${crop.farm_name || 'Field'} • ${formatDate(crop.sowing_date)}</p>
            </div>
            <span class="status-badge ${crop.status?.toLowerCase() || 'planted'}">${crop.status || 'planted'}</span>
        </div>
        <div class="detail-grid">
            ${detailItem('Sowing date', formatDate(crop.sowing_date))}
            ${detailItem('Expected harvest', formatDate(crop.expected_harvest))}
            ${detailItem('Field area', crop.area ? `${crop.area} ha` : '—')}
            ${detailItem('Estimated yield', crop.estimated_yield ? `${crop.estimated_yield} tons` : '—')}
            ${detailItem('Soil type', getSoilTypeForCrop(crop))}
            ${detailItem('Created', formatDate(crop.created_at))}
            ${detailItem('Last updated', formatDate(crop.updated_at))}
        </div>
        <div class="detail-notes">
            <h3>Notes & observations</h3>
            <p>${crop.notes ? crop.notes : 'No notes recorded yet.'}</p>
        </div>
    `;
    detailEl.innerHTML = detailHtml;
  };

  const detailItem = (label, value) => `
        <div class="detail-item">
            <span class="detail-label">${label}</span>
            <span class="detail-value">${value}</span>
        </div>
    `;

  const selectCrop = (cropId) => {
    state.selectedCropId = cropId;
    renderCropsList();
    renderCropDetails();
  };

  const populateFarmSelect = () => {
    if (!farmSelect) return;
    if (!state.farms.length) {
      farmSelect.innerHTML = '<option value="">No fields found</option>';
      farmSelect.disabled = true;
      return;
    }
    farmSelect.disabled = false;
    farmSelect.innerHTML = [
      '<option value="">Select a field</option>',
      ...state.farms.map((farm) => `<option value="${farm.farm_id}">${farm.farm_name || `Field ${farm.farm_id}`}</option>`)
    ].join('');
  };

  const openAddModal = () => {
    populateFarmSelect();
    addModal?.classList.remove('hidden');
  };

  const closeAddModal = () => {
    addModal?.classList.add('hidden');
    addForm?.reset();
  };

  const handleAddCropSubmit = async (event) => {
    event.preventDefault();
    if (!addForm) return;
    const formData = new FormData(addForm);

    const farmId = Number(formData.get('farm_id'));
    if (!farmId) {
      showNotification('Please select a field for this crop.');
      return;
    }

    const payload = {
      farm_id: farmId,
      crop_name: String(formData.get('crop_name')).trim(),
      crop_type: String(formData.get('crop_type')).trim(),
      sowing_date: formData.get('sowing_date') || null,
      expected_harvest: formData.get('expected_harvest') || null,
      area: formData.get('area') ? Number(formData.get('area')) : null,
      soil_type: String(formData.get('soil_type') || '').trim() || null,
      status: String(formData.get('status') || 'planted').trim() || 'planted',
      notes: String(formData.get('notes') || '').trim() || null
    };

    if (!payload.crop_name || !payload.crop_type) {
      showNotification('Crop name and type are required.');
      return;
    }

    const reportSupplement = {
      expected_yield: formData.get('expected_yield') ? Number(formData.get('expected_yield')) : null
    };

    try {
      addForm.classList.add('loading');
      const newCrop = await insertCrop(payload, reportSupplement);
      state.crops = [normalizeCrop(newCrop), ...state.crops];
      renderSummary();
      renderCropsList();
      selectCrop(newCrop.crop_id || newCrop.id);
      closeAddModal();
      showNotification('Crop added successfully!', 'success');
    } catch (error) {
      console.error('Failed to add crop', error);
      showNotification(error.message || 'Unable to save crop right now.');
    } finally {
      addForm.classList.remove('loading');
    }
  };

  const insertCrop = async (payload, reportSupplement) => {
    if (!window.supabase?.from) {
      throw new Error('Supabase client not available.');
    }
    const { data, error } = await window.supabase.from('crops').insert(payload).select().single();
    if (error) throw error;

    if ((reportSupplement.expected_yield ?? null) !== null) {
      await window.supabase.from('crop_reports').insert({
        farm_id: payload.farm_id,
        crop_id: data.crop_id,
        expected_yield: reportSupplement.expected_yield,
        notes: payload.notes || null
      });
    }
    return data;
  };

  const normalizeCropsResponse = (response) => {
    if (response?.success && Array.isArray(response.data) && response.data.length) {
      return response.data.map(normalizeCrop).filter(Boolean);
    }
    if (response?.demo?.crop) {
      return [normalizeCrop({ ...response.demo.crop, farm_name: response.demo.crop.farm_name })];
    }
    return [];
  };

  const loadCrops = async () => {
    setLoading(true);
    try {
      const cropsPromise = typeof window.FarmerAPI?.getCrops === 'function' ? window.FarmerAPI.getCrops(100) : null;
      const farmsPromise = typeof window.FarmerAPI?.getFarms === 'function' ? window.FarmerAPI.getFarms(100) : null;
      const [cropsResponse, farmsResponse] = await Promise.all([cropsPromise, farmsPromise]);

      state.farms = Array.isArray(farmsResponse?.data) ? farmsResponse.data : [];
      state.crops = normalizeCropsResponse(cropsResponse || {});
      if (!state.crops.length && !state.farms.length && !cropsResponse?.success) {
        document.getElementById('demoNotice')?.classList.remove('hidden');
      } else {
        document.getElementById('demoNotice')?.classList.add('hidden');
      }

      renderSummary();
      renderCropsList();
      setLoading(false);
      populateFarmSelect();

      if (state.crops.length) {
        selectCrop(state.crops[0].id);
      } else {
        renderCropDetails();
      }
    } catch (error) {
      console.error('Failed to load crops', error);
      setLoading(false);
      showNotification('Unable to load crops right now.');
    }
  };

  if (openAddBtn) openAddBtn.addEventListener('click', openAddModal);
  if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeAddModal);
  if (closeAddBtn) closeAddBtn.addEventListener('click', closeAddModal);
  if (addModal) {
    addModal.addEventListener('click', (event) => {
      if (event.target === addModal) {
        closeAddModal();
      }
    });
  }
  if (addForm) addForm.addEventListener('submit', handleAddCropSubmit);
  if (refreshBtn) refreshBtn.addEventListener('click', loadCrops);
  if (manageFieldsBtn) {
    manageFieldsBtn.addEventListener('click', () => {
      window.location.href = 'fields.html';
    });
  }

  loadCrops();
})();
