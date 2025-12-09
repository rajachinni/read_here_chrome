// Read Here - Background Service Worker
// Handles extension lifecycle and messaging

// Default reader services (for first install - minimal, users can add more via presets)
const defaultServices = [
  {
    id: 'freedium',
    name: 'Freedium',
    url: 'https://freedium.cfd/{url}',
    color: '#10b981',
    icon: '🔓'
  }
];

// Flag to prevent concurrent menu setup
let isSettingUpMenus = false;
let pendingSetup = false;

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    await chrome.storage.sync.set({
      services: defaultServices,
      whitelistEnabled: true,  // Default: ON (only show on listed sites)
      allowedSites: []
    });
    console.log('Read Here extension installed with default settings');
  }
  
  // Create context menus on install/update
  await setupContextMenus();
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getCurrentTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ url: null });
      }
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'openReader') {
    const { serviceUrl, currentUrl } = message;
    const readerUrl = serviceUrl.replace('{url}', encodeURIComponent(currentUrl));
    chrome.tabs.create({ url: readerUrl });
    sendResponse({ success: true });
    return true;
  }
});

// Update context menu when services change (debounced)
let debounceTimer = null;
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.services) {
    // Debounce to avoid multiple rapid calls
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setupContextMenus();
    }, 100);
  }
});

// Setup context menus with current services
async function setupContextMenus() {
  // Prevent concurrent execution
  if (isSettingUpMenus) {
    pendingSetup = true;
    return;
  }
  
  isSettingUpMenus = true;
  
  try {
    // Remove all existing menus first to avoid duplicates
    await chrome.contextMenus.removeAll();
    
    // Small delay to ensure removeAll completes
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Get current services from storage
    const { services } = await chrome.storage.sync.get(['services']);
    const serviceList = services || defaultServices;
    
    // Create parent menu
    await new Promise((resolve, reject) => {
      chrome.contextMenus.create({
        id: 'read-here-parent',
        title: 'Read Here',
        contexts: ['page', 'link']
      }, () => {
        if (chrome.runtime.lastError) {
          console.log('Parent menu error:', chrome.runtime.lastError.message);
        }
        resolve();
      });
    });

    // Add service items
    if (serviceList && serviceList.length > 0) {
      for (const service of serviceList) {
        await new Promise((resolve) => {
          chrome.contextMenus.create({
            id: `read-here-${service.id}`,
            parentId: 'read-here-parent',
            title: `Read with ${service.name}`,
            contexts: ['page', 'link']
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('Menu item error:', chrome.runtime.lastError.message);
            }
            resolve();
          });
        });
      }
    }
  } catch (e) {
    console.log('Error setting up context menus:', e);
  } finally {
    isSettingUpMenus = false;
    
    // If there was a pending setup request, run it now
    if (pendingSetup) {
      pendingSetup = false;
      setupContextMenus();
    }
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith('read-here-')) {
    const serviceId = info.menuItemId.replace('read-here-', '');
    
    // Skip parent menu click
    if (serviceId === 'parent') return;
    
    // Get current services
    const { services } = await chrome.storage.sync.get(['services']);
    const serviceList = services || defaultServices;
    const service = serviceList.find(s => s.id === serviceId);
    
    if (service) {
      // Use link URL if right-clicked on a link, otherwise use page URL
      const urlToRead = info.linkUrl || info.pageUrl;
      // Check if {url} is in a query string (needs encoding) or path (no encoding)
      const needsEncoding = service.url.includes('?') || service.url.indexOf('{url}') < service.url.lastIndexOf('=');
      const processedUrl = needsEncoding ? encodeURIComponent(urlToRead) : urlToRead;
      const readerUrl = service.url.replace('{url}', processedUrl);
      chrome.tabs.create({ url: readerUrl });
    }
  }
});
