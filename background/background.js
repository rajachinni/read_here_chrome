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

  if (message.type === 'saveToList') {
    handleSaveToList(message).then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'getLists') {
    loadAllLists().then(lists => sendResponse({ lists }));
    return true;
  }

  if (message.type === 'createList') {
    handleCreateList(message).then(sendResponse);
    return true;
  }
});

// Constants for bookmarks
// List IDs are stored in chrome.storage.sync

// Handle save to list request
async function handleSaveToList(message) {
  const { listId, title, url } = message;
  
  // Check if bookmarks API is available
  if (!chrome.bookmarks) {
    return { success: false, error: 'Bookmarks not available' };
  }
  
  try {
    // Check if already saved
    const existing = await chrome.bookmarks.getChildren(listId);
    if (existing.some(b => b.url === url)) {
      const folder = await chrome.bookmarks.get(listId);
      const iconMatch = folder[0].title.match(/^([\p{Emoji}])\s*/u);
      const listName = iconMatch ? folder[0].title.replace(iconMatch[0], '') : folder[0].title;
      return { success: false, error: `Already saved to ${listName}` };
    }
    
    // Create bookmark
    await chrome.bookmarks.create({
      parentId: listId,
      title: title,
      url: url
    });
    
    // Get list name for response
    const folder = await chrome.bookmarks.get(listId);
    const iconMatch = folder[0].title.match(/^([\p{Emoji}])\s*/u);
    const listName = iconMatch ? folder[0].title.replace(iconMatch[0], '') : folder[0].title;
    
    // Load updated lists
    const lists = await loadAllLists();
    
    return { success: true, listName, lists };
  } catch (e) {
    console.error('Error saving to list:', e);
    return { success: false, error: 'Error saving' };
  }
}

// Handle create list request
async function handleCreateList(message) {
  const { name, icon } = message;
  
  if (!chrome.bookmarks) {
    return { success: false, error: 'Bookmarks not available' };
  }
  
  try {
    // Create folder directly in "Other Bookmarks" (id: "2")
    const folder = await chrome.bookmarks.create({
      parentId: '2',
      title: `${icon || '📚'} ${name}`
    });
    
    // Store the list ID
    const result = await chrome.storage.sync.get(['listIds']);
    const listIds = result.listIds || [];
    listIds.push(folder.id);
    await chrome.storage.sync.set({ listIds });
    
    // Return updated lists
    const lists = await loadAllLists();
    return { success: true, lists };
  } catch (e) {
    console.error('Error creating list:', e);
    return { success: false, error: 'Error creating list' };
  }
}

// Load all lists from bookmarks using stored IDs
async function loadAllLists() {
  if (!chrome.bookmarks) {
    console.log('Read Here: Bookmarks API not available');
    return [];
  }
  
  try {
    const result = await chrome.storage.sync.get(['listIds']);
    const listIds = result.listIds || [];
    const lists = [];
    const validIds = [];
    
    for (const listId of listIds) {
      try {
        const folderArr = await chrome.bookmarks.get(listId);
        if (folderArr && folderArr[0] && folderArr[0].url === undefined) {
          const folder = folderArr[0];
          const bookmarks = await chrome.bookmarks.getChildren(folder.id);
          const iconMatch = folder.title.match(/^([\p{Emoji}])\s*/u);
          const icon = iconMatch ? iconMatch[1] : '📚';
          const name = iconMatch ? folder.title.replace(iconMatch[0], '') : folder.title;
          
          lists.push({
            id: folder.id,
            name: name,
            icon: icon,
            bookmarks: bookmarks.filter(b => b.url)
          });
          validIds.push(listId);
        }
      } catch (e) {
        // Folder was deleted externally, skip
      }
    }
    
    // Clean up invalid IDs
    if (validIds.length !== listIds.length) {
      await chrome.storage.sync.set({ listIds: validIds });
    }
    
    return lists;
  } catch (e) {
    console.error('Error loading lists:', e);
    return [];
  }
}

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
