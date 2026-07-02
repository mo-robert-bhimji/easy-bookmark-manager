# 📚 Bookmark Manager

A web-based bookmark manager with AI-powered categorization using DeepSeek API.

## Features

- **Import Chrome Bookmarks** - Upload HTML export files
- **AI-Powered Categorization** - Automatically sorts bookmarks using DeepSeek API
- **Smart Grouping** - Groups bookmarks by domain and URL duplicates
- **Alphabetical Navigation** - Quick access by domain letter
- **Search** - Supports wildcard characters (* and ?)
- **Archive & Delete** - Manage your bookmarks
- **Export** - Export to Chrome HTML with categories
- **Dark/Light Mode** - Follows system preference

## Tech Stack

- Vanilla JavaScript (ES Modules)
- CSS3 with responsive design
- DeepSeek API for AI classification
- localStorage for data persistence

---

## Directory Structure

bookmark-manager/
├── index.html # Main entry point
├── css/
│ ├── style.css # Main CSS import file
│ ├── base/
│ │ ├── reset.css # CSS reset & variables
│ │ ├── typography.css # Fonts and text styles
│ │ └── layout.css # App layout (header, sidebar, content)
│ ├── components/
│ │ ├── badges.css # Domain & duplicate badges
│ │ ├── buttons.css # All button styles
│ │ ├── cards.css # Bookmark card styles
│ │ ├── expand-view.css # Expand view styles
│ │ ├── grid.css # Bookmark grid layout
│ │ ├── import-history.css # Import history section
│ │ ├── modals.css # Import/Export modals
│ │ ├── navigation.css # Categories & alphabet nav
│ │ ├── popups.css # Duplicate popup styles
│ │ ├── progress.css # Classification progress
│ │ ├── search.css # Search bar & filters
│ │ ├── stacks.css # Stacked card styles
│ │ └── toast.css # Toast notifications
│ └── responsive/
│ └── media-queries.css # All responsive styles
├── js/
│ ├── app.js # Main orchestrator
│ ├── aiClassifier.js # DeepSeek API integration
│ ├── bookmarkParser.js # Chrome HTML parser
│ ├── core/
│ │ ├── bookmarkManager.js # Bookmark CRUD & grouping
│ │ ├── categoryManager.js # Category operations
│ │ └── storageManager.js # localStorage operations
│ ├── features/
│ │ ├── classificationManager.js # AI classification with progress
│ │ ├── exportManager.js # JSON & Chrome HTML export
│ │ ├── importManager.js # Chrome HTML & JSON import
│ │ └── thumbnailManager.js # Thumbnail generation & caching
│ ├── ui/
│ │ ├── alphabetNav.js # Alphabetical navigation
│ │ ├── expandView.js # Expand view (full-screen grid)
│ │ ├── popupManager.js # Popup management
│ │ ├── stackRenderer.js # Stacked card rendering
│ │ ├── uiManager.js # UI updates & progress
│ │ └── uiRenderer.js # Individual card rendering
│ └── utils/
│ ├── domHelpers.js # DOM utility functions
│ └── searchHelpers.js # Search & filter functions
├── LICENSE
└── README.md


---

## File Descriptions

### Core Files

| File | Description |
|------|-------------|
| **index.html** | Main HTML file. Contains the app structure, header, sidebar, content area, and modals. |
| **css/style.css** | Main CSS import file. Pulls in all component CSS files. |

### CSS (Base)

| File | Description |
|------|-------------|
| **reset.css** | CSS reset and CSS variables (colors, spacing, shadows). |
| **typography.css** | Font sizes, weights, and text styles. |
| **layout.css** | App layout: header, sidebar, content area, and main structure. |

### CSS (Components)

| File | Description |
|------|-------------|
| **badges.css** | Purple (domain) and blue (duplicate) badges. |
| **buttons.css** | All button styles: primary, secondary, danger, icon buttons. |
| **cards.css** | Bookmark card styling: thumbnail, title, description, tags, footer. |
| **expand-view.css** | Full-screen expand view with individual cards. |
| **grid.css** | Bookmark grid layout and empty state. |
| **import-history.css** | Import history section in sidebar. |
| **modals.css** | Import/Export modal dialogs. |
| **navigation.css** | Categories list and alphabetical navigation. |
| **popups.css** | Duplicate/domain popup styles. |
| **progress.css** | Classification progress bar, steps, log, and controls. |
| **search.css** | Search bar, filters, and sort dropdown. |
| **stacks.css** | Stacked card positioning and hover effects. |
| **toast.css** | Toast notification styles. |

### JavaScript

| File | Description |
|------|-------------|
| **app.js** | Main orchestrator. Initializes all managers, handles events, and coordinates the app. |
| **aiClassifier.js** | DeepSeek API integration. Handles category suggestions, bookmark classification, and keyword matching. |
| **bookmarkParser.js** | Parses Chrome bookmarks HTML export. Extracts title, URL, ADD_DATE, folder path, and domain. |

### JavaScript (Core)

| File | Description |
|------|-------------|
| **bookmarkManager.js** | Bookmark CRUD operations: add, delete, archive, sort, group by URL/domain. |
| **categoryManager.js** | Category operations: add, remove, get counts, extract from bookmarks. |
| **storageManager.js** | localStorage operations: save, load, clear, export/import. |

### JavaScript (Features)

| File | Description |
|------|-------------|
| **classificationManager.js** | AI classification with progress tracking, pause/resume, error handling. |
| **exportManager.js** | JSON and Chrome HTML export. Chrome HTML exports categories as folders. |
| **importManager.js** | Chrome HTML and JSON import. Supports "new only" mode to skip duplicates. |
| **thumbnailManager.js** | Thumbnail generation using Google Favicon API. Caches thumbnails in localStorage. |

### JavaScript (UI)

| File | Description |
|------|-------------|
| **alphabetNav.js** | Alphabetical navigation (A-Z, #). Filters bookmarks by domain letter. |
| **expandView.js** | Full-screen expand view showing all bookmarks in a group as individual cards. |
| **popupManager.js** | Popup management for domain/duplicate groups. Smart positioning near the card. |
| **stackRenderer.js** | Renders stacked cards (overlapping) with badges. |
| **uiManager.js** | UI updates: categories, stats, import history, progress, modals, toasts. |
| **uiRenderer.js** | Individual bookmark card rendering. |

### JavaScript (Utils)

| File | Description |
|------|-------------|
| **domHelpers.js** | DOM utility functions: create elements, query selectors, toggle visibility. |
| **searchHelpers.js** | Search and filter functions: wildcard matching, alphabetical indexing. |

---

## Data Flow

User imports Chrome HTML
→ bookmarkParser.js parses the file
→ importManager.js adds bookmarks
→ storageManager.js saves to localStorage

User clicks "Auto-Classify"
→ aiClassifier.js gets categories from DeepSeek
→ classificationManager.js processes in batches
→ Each bookmark gets a category and tags

User views bookmarks
→ app.js renders categories and bookmarks
→ bookmarkManager.js groups by domain/URL
→ uiRenderer.js creates cards
→ stackRenderer.js creates stacked cards for groups

User clicks a badge
→ popupManager.js shows popup with all bookmarks in group
→ expandView.js shows full-screen view of all bookmarks


---

## Key Concepts

### Categories
Bookmarks are organized into categories (e.g., Technology, Career, Gaming). Categories are determined by AI or manually assigned.

### Groups
- **URL Groups** (Blue badge): Exact duplicate URLs stacked together
- **Domain Groups** (Purple badge): Different URLs from the same domain stacked together

### Badges
- **Purple Badge**: Domain group (e.g., "minecraftforum.net 19")
- **Blue Badge**: URL duplicate group (e.g., "📦 3")

### Sorting
- Date Added (Newest/Oldest)
- Title
- URL
- Category

### Search
- Supports wildcards: `*` (any characters) and `?` (single character)
- Searches: title, URL, description, folder path, category, tags

---

## Configuration

### DeepSeek API
The app uses DeepSeek API for AI classification. You'll be prompted for your API key on first load.

### Thumbnails
Thumbnails use Google's free favicon API and are cached in localStorage.

### Stack Styles
Two stack styles available:
- **Fan**: Cards fan out to the right (default)
- **Subtle**: Minimal fan effect

To change: In `js/ui/stackRenderer.js`, modify `this.stackStyle`.

---

## License

MIT License - see the LICENSE file for details.

Copyright (c) 2026 Mohamed (Mo/Robert) Bhimji