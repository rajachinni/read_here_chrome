// Read Here - Content Script
// Injects a floating "Read Here" button on web pages

let floatingWidget = null;
let services = [];
let allowedSites = [];
let whitelistEnabled = true; // Default: ON (only show on listed sites)
let isExpanded = false;
let hideTimeout = null;

// Get current site hostname
function getCurrentHostname() {
  return window.location.hostname.replace(/^www\./, '');
}

// Check if widget should show on current site
function shouldShowWidget() {
  // No services configured
  if (services.length === 0) return false;
  
  // Whitelist OFF = show on all sites
  if (!whitelistEnabled) return true;
  
  // Whitelist ON = only show if site is in the list
  const currentHost = getCurrentHostname();
  return allowedSites.some(site => {
    return currentHost === site || currentHost.endsWith('.' + site);
  });
}

// Initialize
async function init() {
  await loadSettings();
  
  if (shouldShowWidget()) {
    createFloatingWidget();
  }

  // Listen for settings updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'settingsUpdated') {
      services = message.services || [];
      allowedSites = message.allowedSites || [];
      whitelistEnabled = message.whitelistEnabled !== false;
      
      if (shouldShowWidget()) {
        if (floatingWidget) {
          updateWidgetServices();
        } else {
          createFloatingWidget();
        }
      } else {
        removeFloatingWidget();
      }
    }
  });
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['services', 'allowedSites', 'whitelistEnabled']);
    services = result.services || [];
    allowedSites = result.allowedSites || [];
    whitelistEnabled = result.whitelistEnabled !== false;
  } catch (e) {
    console.log('Read Here: Could not load settings');
  }
}

// Create floating widget
function createFloatingWidget() {
  if (floatingWidget) return;

  floatingWidget = document.createElement('div');
  floatingWidget.id = 'read-here-widget';
  floatingWidget.innerHTML = `
    <div class="rh-main-btn" title="Read Here">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="rh-menu">
      <div class="rh-menu-header">Read Here</div>
      <div class="rh-menu-items"></div>
    </div>
  `;

  document.body.appendChild(floatingWidget);
  updateWidgetServices();
  setupWidgetEvents();
}

// Update widget services
function updateWidgetServices() {
  if (!floatingWidget) return;

  const menuItems = floatingWidget.querySelector('.rh-menu-items');
  if (!menuItems) return;

  menuItems.innerHTML = services.map(service => `
    <button class="rh-menu-item" data-id="${service.id}" style="--item-color: ${service.color}">
      <span class="rh-item-icon">${service.icon || '📖'}</span>
      <span class="rh-item-name">${service.name}</span>
      <svg class="rh-item-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `).join('');

  // Add click handlers to menu items
  menuItems.querySelectorAll('.rh-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      openInReader(item.dataset.id);
    });
  });
}

// Setup widget events
function setupWidgetEvents() {
  if (!floatingWidget) return;

  const mainBtn = floatingWidget.querySelector('.rh-main-btn');

  // Show menu on hover with delay for hiding
  const showMenu = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    floatingWidget.classList.add('rh-show');
  };

  const hideMenu = () => {
    // Delay hiding so user can move to menu
    hideTimeout = setTimeout(() => {
      floatingWidget.classList.remove('rh-show');
    }, 400); // 400ms delay before hiding
  };

  // Whole widget hover (includes padding vicinity)
  floatingWidget.addEventListener('mouseenter', showMenu);
  floatingWidget.addEventListener('mouseleave', hideMenu);

  // Close menu on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (hideTimeout) clearTimeout(hideTimeout);
      floatingWidget.classList.remove('rh-show');
    }
  });

  // Make widget draggable
  makeDraggable(floatingWidget, mainBtn);
}

// Make element draggable
function makeDraggable(widget, handle) {
  let isDragging = false;
  let startX, startY, startLeft, startBottom;
  let hasMoved = false;

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = widget.getBoundingClientRect();
    startLeft = rect.left;
    startBottom = window.innerHeight - rect.bottom;
    
    widget.style.transition = 'none';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = startY - e.clientY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved = true;
    }

    let newLeft = startLeft + deltaX;
    let newBottom = startBottom + deltaY;

    // Keep widget in viewport
    newLeft = Math.max(10, Math.min(window.innerWidth - 60, newLeft));
    newBottom = Math.max(10, Math.min(window.innerHeight - 60, newBottom));

    widget.style.left = `${newLeft}px`;
    widget.style.right = 'auto';
    widget.style.bottom = `${newBottom}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      widget.style.transition = '';
      document.body.style.userSelect = '';
      
      // If dragged, prevent the click from toggling the menu
      if (hasMoved) {
        setTimeout(() => { hasMoved = false; }, 100);
      }
    }
  });

  // Prevent click toggle after drag
  handle.addEventListener('click', (e) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}

// Open current page in reader service
function openInReader(serviceId) {
  const service = services.find(s => s.id === serviceId);
  if (!service) return;

  const currentUrl = window.location.href;
  // Check if {url} is in a query string (needs encoding) or path (no encoding)
  const needsEncoding = service.url.includes('?') || service.url.indexOf('{url}') < service.url.lastIndexOf('=');
  const processedUrl = needsEncoding ? encodeURIComponent(currentUrl) : currentUrl;
  const readerUrl = service.url.replace('{url}', processedUrl);
  
  window.open(readerUrl, '_blank');
  
  // Close menu after clicking
  if (floatingWidget) {
    floatingWidget.classList.remove('rh-show');
  }
}

// Remove floating widget
function removeFloatingWidget() {
  if (floatingWidget) {
    floatingWidget.remove();
    floatingWidget = null;
    isExpanded = false;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

