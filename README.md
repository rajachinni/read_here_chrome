# 📖 Read Here - Chrome Extension

A Chrome extension that lets you quickly redirect articles to your favorite reading services. Perfect for bypassing paywalls, saving articles for later, or getting a clean reading experience.

## ✨ Features

### Core Features
- 🎯 **Floating Button**: Hover to reveal reader options on any webpage
- 🔓 **Paywall Bypass**: Built-in support for Freedium, 12ft Ladder, and more
- ⚙️ **Fully Configurable**: Add, edit, or remove reader services
- 🎨 **Customizable Colors**: Set custom colors for each service button
- 📱 **Draggable Widget**: Move the floating button anywhere on the page

### 📚 Save to Lists (NEW!)
- 📁 **Custom Lists**: Create lists like "Read Later", "Finance", "Tech"
- ⚡ **One-Click Save**: Save articles to lists from the floating menu
- 🔖 **Uses Chrome Bookmarks**: Data survives extension uninstall!
- 🔄 **Auto Sync**: Lists sync across all your Chrome browsers
- 📤 **Easy Export**: Use Chrome's bookmark export to backup lists

### Site Whitelist
- ✅ **Whitelist Mode**: Only show the button on sites you choose
- ➕ **Quick Add**: One-click to add current site to whitelist
- 🌐 **Show Everywhere**: Toggle off whitelist to show on all sites

### Additional Features
- 🖱️ **Right-Click Menu**: Access reader services from context menu
- 💾 **Synced Settings**: Settings sync across all Chrome browsers
- ⚡ **Preset Services**: One-click add popular reading services

## 🚀 Installation

### Step 1: Download the Code

```bash
# Option A: Clone with Git
git clone https://github.com/YOUR_USERNAME/read-here-extension.git

# Option B: Download ZIP
# Click green "Code" button → "Download ZIP" → Extract
```

### Step 2: Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **"Load unpacked"**
4. Select the `readExtension` folder
5. Done! 🎉

The extension icon will appear in your toolbar. Click the puzzle icon 🧩 to pin it.

## 📖 Usage

### Floating Button (Hover Menu)
1. **Hover** over the purple 📖 button (bottom-right corner)
2. Menu appears with:
   - **Reader services** (Freedium, Pocket, etc.)
   - **Save to List** options (if you have lists)
3. **Click** a service to open article OR save to a list
4. **Drag** the button to reposition it

### Save to Lists
1. Click extension icon → **Saved** tab
2. Click **➕** to create a new list (e.g., "Read Later")
3. Choose an icon and name → **Create List**
4. Now when you hover the floating button, you'll see your lists!
5. Click a list name to save the current article

**View saved articles:**
- Go to **Saved** tab → Click a list to expand → Click article to open

**Pro tip:** Your lists are stored as Chrome bookmarks, so they:
- Sync across devices automatically
- Can be exported via Chrome's bookmark manager
- Survive if you uninstall the extension

### Quick Read (Popup)
1. Click the extension icon in toolbar
2. See current site status (whitelisted or not)
3. Click any service button to open article
4. Or save directly to a list

### Right-Click Menu
1. Right-click anywhere on page (or on a link)
2. Select **"Read Here"** → Choose service

## ⚙️ Configuration

### Site Whitelist

Control where the floating button appears:

| Setting | Behavior |
|---------|----------|
| ✅ **Whitelist ON** + No sites | Button shows **nowhere** |
| ✅ **Whitelist ON** + Sites added | Button shows **only on those sites** |
| ⬜ **Whitelist OFF** | Button shows **everywhere** |

**To configure:**
1. Click extension icon → **Settings** tab
2. Toggle **"Only show on listed sites"**
3. Add sites using the input field (e.g., `medium.com`)

### Reader Services

**Add from Presets (Easy):**
1. Go to **Settings** → **Quick Add Presets**
2. Click any service button to add it

**Add Custom Service:**
1. Go to **Settings** → Click **"Add Custom Service"**
2. Enter:
   - **Name**: Display name (e.g., "My Reader")
   - **URL Pattern**: Service URL with `{url}` placeholder
   - **Color**: Button color
3. Click **Save**

## 📋 Available Presets

| Service | Description | URL Pattern |
|---------|-------------|-------------|
| 🔓 Freedium | Bypass Medium paywalls | `https://freedium.cfd/{url}` |
| 📥 Pocket | Save for later | `https://getpocket.com/save?url={url}` |
| 📄 Instapaper | Read it later | `https://www.instapaper.com/hello2?url={url}` |
| 📖 Jina Reader | Clean reader view | `https://r.jina.ai/{url}` |
| 🪜 12ft Ladder | Bypass paywalls | `https://12ft.io/{url}` |
| 📦 Archive.today | Archive pages | `https://archive.today/?run=1&url={url}` |
| 📑 Outline | Clean article view | `https://outline.com/{url}` |
| 💡 Readwise | Save to Readwise | `https://readwise.io/save?url={url}` |

## 🔧 Custom Service Examples

```
# Omnivore
https://omnivore.app/api/save?url={url}

# Wallabag (self-hosted)
https://your-wallabag.com/bookmarklet?url={url}

# Web Archive
https://web.archive.org/save/{url}

# Google Cache
https://webcache.googleusercontent.com/search?q=cache:{url}
```

**Note:** Use `{url}` where the article URL should be inserted.
- Services with `?url=` get encoded URLs
- Services with `/{url}` get raw URLs (like Freedium)

## 📁 File Structure

```
readExtension/
├── manifest.json          # Extension configuration
├── background/
│   └── background.js      # Service worker & context menus
├── content/
│   ├── content.js         # Floating button logic
│   └── content.css        # Floating button styles
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles (dark theme)
│   └── popup.js           # Settings & service management
├── icons/
│   ├── icon16.png         # Toolbar icon
│   ├── icon32.png         # Extension icon
│   ├── icon48.png         # Extension management icon
│   └── icon128.png        # Chrome Web Store icon
└── README.md
```

## ❓ Troubleshooting

### Extension not showing in toolbar?
1. Make sure **Developer mode** is enabled in `chrome://extensions/`
2. Check if the extension is enabled (toggle should be ON)
3. Click the puzzle icon 🧩 in toolbar → Pin "Read Here"

### Floating button not appearing?
1. Open extension popup → **Settings**
2. Check if **"Only show on listed sites"** is ON
3. If ON, add the current site to the whitelist
4. Refresh the webpage

### Changes not taking effect?
1. Go to `chrome://extensions/`
2. Click the **refresh** ↻ icon on Read Here
3. Refresh the webpage you're testing

## 🛠️ Development

### Making Changes
1. Edit source files
2. Go to `chrome://extensions/`
3. Click **refresh** ↻ on Read Here
4. Refresh the webpage you're testing

### Debugging
- **Popup**: Right-click extension icon → "Inspect popup"
- **Content Script**: DevTools → Console (on any page)
- **Background**: `chrome://extensions/` → "Service worker"

## 🔒 Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save settings, sync across browsers |
| `activeTab` | Get current tab URL |
| `tabs` | Open articles in new tabs |
| `contextMenus` | Right-click menu integration |

