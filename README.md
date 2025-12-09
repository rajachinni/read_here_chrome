# 📖 Read Here - Chrome Extension

A Chrome extension that lets you quickly redirect articles to your favorite reading services with a single click.

![Read Here Preview](preview.png)

## Features

- 🎯 **Floating Button**: A beautiful floating "Read Here" button appears on every webpage
- ⚙️ **Configurable Services**: Add your favorite reading services (Pocket, Instapaper, Reader View, etc.)
- 🎨 **Customizable**: Set custom colors for each service button
- 📱 **Draggable Widget**: Move the floating button anywhere on the page
- 🖱️ **Right-Click Menu**: Access reading services from the context menu
- 💾 **Synced Settings**: Your settings sync across all Chrome browsers

## Installation

### Step 1: Generate Icons

1. Open `/icons/generate-icons.html` in Chrome
2. Click "Download All Icons"
3. Save all 4 PNG files (`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`) to the `icons` folder

### Step 2: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `readExtension` folder
5. The extension should now appear in your toolbar!

## Usage

### Quick Read (Popup)
1. Click the extension icon in your toolbar
2. Click any service button to open the current page in that reader

### Floating Button
1. Look for the purple floating button in the bottom-right corner of any webpage
2. Click it to expand the menu
3. Choose a reading service to redirect the current article
4. Drag the button to reposition it anywhere on the page

### Right-Click Menu
1. Right-click anywhere on a page (or on a link)
2. Select "Read Here" → Choose your reading service

### Configure Services

1. Click the extension icon
2. Go to the **Settings** tab
3. Click **Add New Service** to add a custom reader
4. Enter:
   - **Name**: Display name for the service
   - **URL Pattern**: The service URL with `{url}` placeholder
   - **Color**: Button color
5. Click **Save Settings**

## Pre-configured Services

| Service | Description | URL Pattern |
|---------|-------------|-------------|
| Pocket | Save for later | `https://getpocket.com/save?url={url}` |
| Instapaper | Read it later | `https://www.instapaper.com/hello2?url={url}` |
| Reader View | Jina AI Reader | `https://r.jina.ai/{url}` |

## Adding Custom Services

Here are some popular services you can add:

```
# Readwise Reader
https://readwise.io/reader/save?url={url}

# Omnivore
https://omnivore.app/api/save?url={url}

# Wallabag (self-hosted)
https://your-wallabag.com/bookmarklet?url={url}

# Firefox Reader Mode (via service)
about:reader?url={url}

# 12ft Ladder (bypass paywalls)
https://12ft.io/{url}

# Archive.today
https://archive.today/?run=1&url={url}

# Outline
https://outline.com/{url}
```

## File Structure

```
readExtension/
├── manifest.json          # Extension configuration
├── background/
│   └── background.js      # Service worker
├── content/
│   ├── content.js         # Floating button logic
│   └── content.css        # Floating button styles
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── icons/
│   ├── generate-icons.html # Icon generator
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Development

### Making Changes

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Read Here extension card
4. Test your changes

### Debugging

- **Popup**: Right-click the extension icon → Inspect popup
- **Content Script**: Open DevTools on any page → Console
- **Background**: Go to `chrome://extensions/` → Click "Service worker"

## Permissions Used

- `storage`: Save your settings and sync across browsers
- `activeTab`: Access the current tab's URL
- `tabs`: Create new tabs for reader services

## License

MIT License - Feel free to modify and distribute!

---

Made with ❤️ for better reading experiences

