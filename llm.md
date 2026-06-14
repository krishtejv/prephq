# PrepHQ | AI Context Index (`llm.md`)

This document is optimized for Large Language Models (LLMs) to get up to speed quickly on the PrepHQ codebase. It indexes structure, APIs, state synchronization mechanisms, database schemas, styling rules, and development operations.

---

## 1. Codebase Architecture

```
PrepHQ/
├── README.md                      # Core product overview and manual setups
├── api_docs.md                    # In-depth HTTP backend API endpoints guide
├── Dockerfile                     # Nginx client deployment config
├── docker-compose.yml             # Orchestration mapping port 80 (client) & 5001 (api)
├── eslint.config.js               # Linting rules
├── index.html                     # SPA HTML entry point
├── package.json                   # React package details (Lucide, Marked, DOMPurify)
├── postcss.config.js              # Styles preprocessing config
├── tailwind.config.js             # Styling tokens and accent configurations
├── vite.config.js                 # Vite bundling setup
├── server/                        # Backend Node.js Environment
│   ├── .env.example               # Fallback environment settings
│   ├── authMiddleware.js          # JWT Generation (7d) & Bearer verification
│   ├── database.js                # SQLite Initialization (WAL Mode, normal sync, index setup)
│   ├── defaultSeed.js             # SQLite seed configurations (quant templates)
│   ├── index.js                   # Express Server. Rates limited. Database transaction logic.
│   ├── logger.js                  # Pino rotating JSON logs and pretty console print
│   └── package.json               # Backend dependencies (Express, Rate limit, Pino, sqlite3)
├── src/                           # Frontend React Environment
│   ├── App.jsx                    # Navigation, global keystroke listeners (Ctrl+K palette)
│   ├── main.jsx                   # Entry point, ErrorBoundary wrapper
│   ├── index.css                  # Styling overrides, variables, markdown custom CSS
│   ├── components/
│   │   ├── CompanyProfiles.jsx    # Firm lists & timeline detail modal
│   │   ├── ErrorBoundary.jsx      # Catches React render crashes, POSTs logs to backend
│   │   ├── ImageResizerOverlay.jsx# Google Docs-style inline image resize handles
│   │   ├── IndustryPatterns.jsx   # High-performance blueprints Markdown viewer/editor
│   │   ├── LearningDashboard.jsx  # KPI metrics, categories, flashcards accordion
│   │   ├── LoginScreen.jsx        # Auth registration & authorization login
│   │   ├── PersonalCenter.jsx     # settings, HTML/Markdown exports, latency ping
│   │   ├── Sidebar.jsx            # Desktop left panel navigation tabs
│   │   ├── TopBar.jsx             # Top search trigger bar & user credentials status
│   │   ├── ToastContainer.jsx     # Floating flash notification items
│   │   ├── dashboard/             # Domain tabs, Question cards, Stats components
│   │   ├── notebook/              # Tree sidebar notes editor, zoom, markdown tools
│   │   └── shared/                # Confirm deletion modals, custom status pills
│   ├── context/
│   │   ├── PrepContext.jsx        # PrepProvider state manager & debounced granular sync
│   │   └── defaultData.js         # Default JSON fallback config for local client
│   └── utils/
│       ├── htmlUtils.js           # Markdown-to-HTML parser (Sanitizes all isHtml outputs)
│       ├── logger.js              # Browser thin wrapper logging debug/info/warn/error
│       └── treeUtils.js           # Outline note nodes lookup, deletion, children insertion
└── tests/                         # E2E Playwright Testing Suite
    ├── dashboard.spec.cjs          # Playwright test loops (nav, CRUDs, Read View verification)
    └── visual-ux-audit.cjs         # Screenshot generation audit runner (port 5173 target)
```

---

## 2. State & Sync Pipeline

```
[UI Mutation Trigger]
       │
       ▼
[PrepContext Mutator]
       │
       ├─► Update Client State (React Context)
       ▼
[markSliceDirty("sliceName")]
       │  Sets dirtySlices.slice = true & saveState = "unsaved"
       ▼
[Debounced Sync useEffect]
       │  Fires after 1000ms idle. Resets dirtySlices state locally.
       ▼
[Promise.all(granularPATCH)]
       │  Sends HTTP PATCH to server with only the dirty JSON state
       ├─► POST /api/notebook/import  (For notebookTree edits)
       ├─► PATCH /api/user/state/*   (For streak, plan, domains, neetcode, co, patterns)
       ▼
[Server DB Commit / Rollback]
```

### Granular Sync Slices Mappings
* **`domains`**: `addCustomDomain`, `deleteCustomDomain`, `updateQuestion`, `addCustomQuestion`, `deleteQuestion`, `updateNeetcodeProblem`.
* **`companies`**: `addCompany`, `updateCompany`, `deleteCompany`.
* **`patterns`**: `addPattern`, `updatePattern`, `deletePattern`, `reorderPattern`.
* **`prepPlan`**: `addPrepWeek`, `deletePrepWeek`, `addPrepTask`, `deletePrepTask`, `togglePrepTask`, `updatePrepWeek`.
* **`neetcode`**: `updateNeetcodeProblem`.
* **`notebookTree`**: `updateNoteContent`, `updateNoteStatus`, `createNoteNode`, `toggleCollapseAllNoteNodes`, `deleteNoteNode`, `renameNoteNode`, `reorderNoteNode`.

---

## 3. Database Schema

### Table: `users`
* `id` TEXT PRIMARY KEY (UUID)
* `username` TEXT UNIQUE NOT NULL
* `password_hash` TEXT NOT NULL
* `created_at` TEXT NOT NULL

### Table: `study_state`
* `user_id` TEXT PRIMARY KEY (Foreign key -> `users(id)` ON DELETE CASCADE)
* `streak` INTEGER DEFAULT 0
* `last_studied_date` TEXT
* `prep_plan` TEXT (JSON Array)
* `domains` TEXT (JSON Object)
* `neetcode` TEXT (JSON Array)
* `companies` TEXT (JSON Array)
* `patterns` TEXT (JSON Array)

### Table: `notebook_pages`
* `id` TEXT PRIMARY KEY
* `user_id` TEXT NOT NULL (Foreign key -> `users(id)` ON DELETE CASCADE)
* `parent_id` TEXT
* `title` TEXT NOT NULL
* `body` TEXT DEFAULT ''
* `status` TEXT DEFAULT 'todo'
* `collapsed` INTEGER DEFAULT 0
* `sort_order` INTEGER DEFAULT 0
* `type` TEXT DEFAULT 'file'
* *Index*: `idx_pages_user_parent` ON `(user_id, parent_id)`

---

## 4. Key Security & Performance Rules
1. **XSS Safety**: Never render raw HTML content in contentEditable preview canvas without passing it through `DOMPurify.sanitize()` first inside `htmlUtils.js`.
2. **Concurrency (WAL)**: Database runs in SQLite WAL (Write-Ahead Logging) mode (`journal_mode = WAL`, `synchronous = NORMAL`). Do not alter database connection parameters in `server/database.js` without considering lock conditions.
3. **Transaction Safety**: All multi-statement write routes (import, reorder, recursive deletes) must execute within a `BEGIN TRANSACTION` / `COMMIT` block and perform `ROLLBACK` inside the `catch` block to protect state integrity.
4. **Rate Limiters**: Access routes are limited to 200 requests/minute to defend Express services from script spamming.

---

## 5. Development Command Sheet

### Frontend setup & dev
```bash
npm install
npm run dev      # Runs on port 5173 by default
npm run build    # Compiles production bundle in /dist
```

### Backend setup & dev
```bash
cd server
npm install
npm run dev      # Starts Express on port 5001 with nodemon watcher
```

### Running Tests
```bash
npm run test     # Launches playwright testing suites
```
