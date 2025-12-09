// Default reader services (for first install)
const defaultServices = [
  {
    id: 'freedium',
    name: 'Freedium',
    url: 'https://freedium.cfd/{url}',
    color: '#10b981',
    icon: '🔓'
  }
];

// All available preset services users can add
const presetServices = [
  {
    id: 'freedium',
    name: 'Freedium',
    url: 'https://freedium.cfd/{url}',
    color: '#10b981',
    icon: '🔓',
    description: 'Bypass Medium paywalls'
  },
  {
    id: 'pocket',
    name: 'Pocket',
    url: 'https://getpocket.com/save?url={url}',
    color: '#ef4056',
    icon: '📥',
    description: 'Save for later'
  },
  {
    id: 'instapaper',
    name: 'Instapaper',
    url: 'https://www.instapaper.com/hello2?url={url}',
    color: '#1f1f1f',
    icon: '📄',
    description: 'Read it later'
  },
  {
    id: 'reader-mode',
    name: 'Jina Reader',
    url: 'https://r.jina.ai/{url}',
    color: '#6366f1',
    icon: '📖',
    description: 'Clean reader view'
  },
  {
    id: '12ft',
    name: '12ft Ladder',
    url: 'https://12ft.io/{url}',
    color: '#f59e0b',
    icon: '🪜',
    description: 'Bypass paywalls'
  },
  {
    id: 'archive',
    name: 'Archive.today',
    url: 'https://archive.today/?run=1&url={url}',
    color: '#3b82f6',
    icon: '📦',
    description: 'Archive pages'
  },
  {
    id: 'outline',
    name: 'Outline',
    url: 'https://outline.com/{url}',
    color: '#8b5cf6',
    icon: '📑',
    description: 'Clean article view'
  },
  {
    id: 'readwise',
    name: 'Readwise',
    url: 'https://readwise.io/save?url={url}',
    color: '#fbbf24',
    icon: '💡',
    description: 'Save to Readwise'
  }
];

let services = [];
let editingServiceId = null;
let allowedSites = [];
let whitelistEnabled = true; // Default: ON (only show on listed sites)
let currentSiteHostname = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await getCurrentSite();
  setupEventListeners();
  renderQuickReadButtons();
  renderServicesList();
  renderPresetList();
  renderAllowedSites();
  updateSiteStatus();
});

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.sync.get(['services', 'allowedSites', 'whitelistEnabled']);
  services = result.services || [...defaultServices];
  allowedSites = result.allowedSites || [];
  // Default to TRUE (whitelist ON = only show on listed sites)
  whitelistEnabled = result.whitelistEnabled !== false;
  
  document.getElementById('whitelist-enabled').checked = whitelistEnabled;
  updateWhitelistUI();
}

// Get current site hostname
async function getCurrentSite() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url) {
      const url = new URL(tabs[0].url);
      currentSiteHostname = url.hostname.replace(/^www\./, '');
    }
  } catch (e) {
    currentSiteHostname = '';
  }
}

// Update whitelist UI state
function updateWhitelistUI() {
  const container = document.getElementById('allowed-sites-container');
  const hint = document.getElementById('whitelist-hint');
  
  if (whitelistEnabled) {
    container.classList.remove('disabled');
    hint.textContent = allowedSites.length === 0 
      ? 'Add sites below to show the button' 
      : `Showing on ${allowedSites.length} site${allowedSites.length > 1 ? 's' : ''}`;
  } else {
    container.classList.add('disabled');
    hint.textContent = 'Button shows on all websites';
  }
}

// Save settings to storage
async function saveSettings() {
  whitelistEnabled = document.getElementById('whitelist-enabled').checked;
  
  await chrome.storage.sync.set({ 
    services, 
    allowedSites,
    whitelistEnabled
  });
  
  // Notify content scripts about the update
  notifyContentScript();
  
  showToast('Settings saved!');
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });

  // Add service button
  document.getElementById('add-service').addEventListener('click', () => {
    editingServiceId = null;
    document.getElementById('modal-title').textContent = 'Add Reader Service';
    document.getElementById('service-name').value = '';
    document.getElementById('service-url').value = '';
    document.getElementById('service-color').value = '#6366f1';
    showModal();
  });

  // Modal buttons
  document.getElementById('cancel-modal').addEventListener('click', hideModal);
  document.getElementById('save-service').addEventListener('click', saveService);

  // Save settings button
  document.getElementById('save-settings').addEventListener('click', () => {
    saveSettings();
    renderQuickReadButtons();
  });

  // Close modal on backdrop click
  document.getElementById('service-modal').addEventListener('click', (e) => {
    if (e.target.id === 'service-modal') {
      hideModal();
    }
  });

  // Toggle current site button
  document.getElementById('toggle-site-btn').addEventListener('click', toggleCurrentSite);

  // Whitelist toggle - save immediately
  document.getElementById('whitelist-enabled').addEventListener('change', async (e) => {
    whitelistEnabled = e.target.checked;
    updateWhitelistUI();
    updateSiteStatus();
    
    // Save and notify
    await chrome.storage.sync.set({ whitelistEnabled });
    notifyContentScript();
    
    showToast(whitelistEnabled ? 'Only showing on listed sites' : 'Showing on all sites');
  });

  // Add site button
  document.getElementById('add-site-btn').addEventListener('click', addSiteFromInput);
  
  // Add site on Enter key
  document.getElementById('new-site-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSiteFromInput();
    }
  });
}

// Render quick read buttons
function renderQuickReadButtons() {
  const container = document.getElementById('reader-buttons');
  const emptyState = document.getElementById('empty-state');
  
  if (services.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }
  
  emptyState.style.display = 'none';
  container.innerHTML = services.map(service => `
    <button class="reader-btn" data-id="${service.id}" style="--btn-color: ${service.color}">
      <span class="icon">${service.icon || '📖'}</span>
      <span class="name">${service.name}</span>
      <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.reader-btn').forEach(btn => {
    btn.addEventListener('click', () => openInReader(btn.dataset.id));
  });
}

// Render services list in settings
function renderServicesList() {
  const container = document.getElementById('services-list');
  
  if (services.length === 0) {
    container.innerHTML = '<p class="help-text" style="text-align: center; padding: 20px;">No services configured</p>';
    return;
  }
  
  container.innerHTML = services.map(service => `
    <div class="service-item" data-id="${service.id}">
      <div class="service-color" style="background: ${service.color}"></div>
      <div class="service-info">
        <div class="service-name">${service.name}</div>
        <div class="service-url">${service.url}</div>
      </div>
      <div class="service-actions">
        <button class="edit" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="delete" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.service-item').dataset.id;
      editService(id);
    });
  });

  container.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.service-item').dataset.id;
      deleteService(id);
    });
  });
}

// Open current page in reader
async function openInReader(serviceId) {
  const service = services.find(s => s.id === serviceId);
  if (!service) return;

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    const currentUrl = tabs[0].url;
    // Check if {url} is in a query string (needs encoding) or path (no encoding)
    const needsEncoding = service.url.includes('?') || service.url.indexOf('{url}') < service.url.lastIndexOf('=');
    const processedUrl = needsEncoding ? encodeURIComponent(currentUrl) : currentUrl;
    const readerUrl = service.url.replace('{url}', processedUrl);
    chrome.tabs.create({ url: readerUrl });
  }
}

// Edit service
function editService(id) {
  const service = services.find(s => s.id === id);
  if (!service) return;

  editingServiceId = id;
  document.getElementById('modal-title').textContent = 'Edit Reader Service';
  document.getElementById('service-name').value = service.name;
  document.getElementById('service-url').value = service.url;
  document.getElementById('service-color').value = service.color;
  showModal();
}

// Delete service
async function deleteService(id) {
  const serviceName = services.find(s => s.id === id)?.name || 'Service';
  services = services.filter(s => s.id !== id);
  
  // Save immediately to storage
  await chrome.storage.sync.set({ services });
  
  // Re-render UI
  renderServicesList();
  renderQuickReadButtons();
  renderPresetList();
  
  // Notify content scripts
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { 
      type: 'settingsUpdated',
      showFloatingBtn: document.getElementById('show-floating-btn').checked,
      services 
    }).catch(() => {});
  }
  
  showToast(`${serviceName} deleted!`);
}

// Save service from modal
function saveService() {
  const name = document.getElementById('service-name').value.trim();
  const url = document.getElementById('service-url').value.trim();
  const color = document.getElementById('service-color').value;

  if (!name || !url) {
    alert('Please fill in all fields');
    return;
  }

  if (!url.includes('{url}')) {
    alert('URL pattern must include {url} placeholder');
    return;
  }

  // Get emoji based on name
  const icon = getServiceIcon(name);

  if (editingServiceId) {
    // Update existing
    const index = services.findIndex(s => s.id === editingServiceId);
    if (index !== -1) {
      services[index] = { ...services[index], name, url, color, icon };
    }
  } else {
    // Add new
    services.push({
      id: `service-${Date.now()}`,
      name,
      url,
      color,
      icon
    });
  }

  hideModal();
  renderServicesList();
  renderQuickReadButtons();
}

// Get icon for service based on name
function getServiceIcon(name) {
  const lower = name.toLowerCase();
  if (lower.includes('freedium')) return '🔓';
  if (lower.includes('pocket')) return '📥';
  if (lower.includes('instapaper')) return '📄';
  if (lower.includes('reader') || lower.includes('jina')) return '📖';
  if (lower.includes('kindle')) return '📚';
  if (lower.includes('notion')) return '📝';
  if (lower.includes('evernote')) return '🐘';
  if (lower.includes('12ft') || lower.includes('ladder')) return '🪜';
  if (lower.includes('archive')) return '📦';
  if (lower.includes('outline')) return '📑';
  if (lower.includes('readwise')) return '💡';
  if (lower.includes('read')) return '👓';
  return '🔗';
}

// Render preset list
function renderPresetList() {
  const container = document.getElementById('preset-list');
  if (!container) return;
  
  container.innerHTML = presetServices.map(preset => {
    const isAdded = services.some(s => s.id === preset.id);
    return `
      <button class="preset-btn ${isAdded ? 'added' : ''}" 
              data-id="${preset.id}" 
              title="${preset.description}"
              ${isAdded ? 'disabled' : ''}>
        <span class="preset-icon">${preset.icon}</span>
        <span>${preset.name}</span>
        ${isAdded ? '<span class="preset-check">✓</span>' : ''}
      </button>
    `;
  }).join('');

  // Add click handlers
  container.querySelectorAll('.preset-btn:not(.added)').forEach(btn => {
    btn.addEventListener('click', () => addPreset(btn.dataset.id));
  });
}

// Add preset service
async function addPreset(presetId) {
  const preset = presetServices.find(p => p.id === presetId);
  if (!preset) return;
  
  // Check if already exists
  if (services.some(s => s.id === preset.id)) {
    showToast(`${preset.name} already added!`);
    return;
  }
  
  // Add the service
  services.push({
    id: preset.id,
    name: preset.name,
    url: preset.url,
    color: preset.color,
    icon: preset.icon
  });
  
  // Save immediately to storage
  await chrome.storage.sync.set({ services });
  
  // Re-render everything
  renderServicesList();
  renderQuickReadButtons();
  renderPresetList();
  
  // Notify content scripts
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { 
      type: 'settingsUpdated',
      showFloatingBtn: document.getElementById('show-floating-btn').checked,
      services 
    }).catch(() => {});
  }
  
  showToast(`${preset.name} added!`);
}

// Show modal
function showModal() {
  document.getElementById('service-modal').classList.add('active');
}

// Hide modal
function hideModal() {
  document.getElementById('service-modal').classList.remove('active');
  editingServiceId = null;
}

// Show toast notification
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ============ ALLOWED SITES FUNCTIONS ============

// Update site status display in Quick Read tab
function updateSiteStatus() {
  const siteNameEl = document.getElementById('current-site-name');
  const toggleBtn = document.getElementById('toggle-site-btn');
  const toggleText = document.getElementById('toggle-site-text');
  const statusIcon = document.querySelector('.site-status-icon');
  
  if (!currentSiteHostname) {
    siteNameEl.textContent = 'No site detected';
    toggleBtn.style.display = 'none';
    return;
  }
  
  siteNameEl.textContent = currentSiteHostname;
  toggleBtn.style.display = 'block';
  
  const isAllowed = allowedSites.includes(currentSiteHostname);
  
  if (isAllowed) {
    toggleBtn.classList.add('added');
    toggleText.textContent = 'Remove';
    statusIcon.textContent = '✅';
  } else {
    toggleBtn.classList.remove('added');
    toggleText.textContent = 'Add Site';
    statusIcon.textContent = '🌐';
  }
}

// Toggle current site in allowed list
async function toggleCurrentSite() {
  if (!currentSiteHostname) return;
  
  const isAllowed = allowedSites.includes(currentSiteHostname);
  
  if (isAllowed) {
    // Remove site
    allowedSites = allowedSites.filter(s => s !== currentSiteHostname);
    showToast(`${currentSiteHostname} removed`);
  } else {
    // Add site
    allowedSites.push(currentSiteHostname);
    showToast(`${currentSiteHostname} added!`);
  }
  
  // Save and update UI
  await chrome.storage.sync.set({ allowedSites });
  updateSiteStatus();
  renderAllowedSites();
  
  // Notify content script
  notifyContentScript();
}

// Render allowed sites list
function renderAllowedSites() {
  const container = document.getElementById('allowed-sites-list');
  
  if (allowedSites.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = allowedSites.map(site => `
    <div class="site-item" data-site="${site}">
      <span class="site-item-name">${site}</span>
      <button class="site-item-remove" title="Remove">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Add remove handlers
  container.querySelectorAll('.site-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const site = e.target.closest('.site-item').dataset.site;
      removeSite(site);
    });
  });
}

// Add site from input
async function addSiteFromInput() {
  const input = document.getElementById('new-site-input');
  let site = input.value.trim().toLowerCase();
  
  if (!site) return;
  
  // Clean up the input (remove protocol, www, paths)
  try {
    if (site.includes('://')) {
      site = new URL(site).hostname;
    }
    site = site.replace(/^www\./, '').replace(/\/.*$/, '');
  } catch (e) {
    // Keep as is if not a valid URL
  }
  
  if (allowedSites.includes(site)) {
    showToast(`${site} already in list`);
    return;
  }
  
  allowedSites.push(site);
  await chrome.storage.sync.set({ allowedSites });
  
  input.value = '';
  renderAllowedSites();
  updateSiteStatus();
  updateWhitelistUI();
  notifyContentScript();
  
  showToast(`${site} added!`);
}

// Remove site from allowed list
async function removeSite(site) {
  allowedSites = allowedSites.filter(s => s !== site);
  await chrome.storage.sync.set({ allowedSites });
  
  renderAllowedSites();
  updateSiteStatus();
  updateWhitelistUI();
  notifyContentScript();
  
  showToast(`${site} removed`);
}

// Notify content script about changes
async function notifyContentScript() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { 
      type: 'settingsUpdated',
      whitelistEnabled,
      allowedSites,
      services 
    }).catch(() => {});
  }
}

