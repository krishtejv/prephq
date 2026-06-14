# PrepHQ Documentation Update & Agent Integration Blueprint

This report details a complete technical scan of the PrepHQ codebase (Vite React frontend, Express/SQLite backend). It provides updated user and developer documentation, a comprehensive API reference, a design blueprint for a Model Context Protocol (MCP) server or LLM agent connection, and meticulous planning for exception handling, logging, security, and efficiency updates.

---

## 📂 Codebase Scan Summary

PrepHQ is designed with a lightweight React client and a high-performance Express + SQLite backend.
- **Frontend (`src/`)**: Comprises modular React components decomposed into `notebook/` (left sidebar node tree, header bar, WYSIWYG formatting toolbar, and editing paper canvas), `dashboard/` (stats panels, domain categories, and recall question cards), and other shared layers. State is handled globally via React Context (`context/PrepContext.jsx`) and syncs to the server with a 1-second debounce.
- **Backend (`server/`)**: Built on Express, SQLite3, Helmet, and CORS. Requests are protected by a JWT-based authentication middleware (`authMiddleware.js`), rate-limiting, and structured JSON body limits. High-speed structured logging is achieved using Pino, Pino-HTTP, and log rotation via Pino-Roll.

---

## 📝 Part 1: Updated README.md
*(This content represents the updated version of `README.md` to match the latest application features including title decoupling and toggle collapse controls).*

```markdown
# PrepHQ | Interview, Coding & Note Workstation

PrepHQ is a highly optimized, premium visual learning dashboard and active-recall workstation designed for high-frequency trading (HFT) preparers, quant developers, and computer systems engineers. It integrates full-featured study notebooks, targeted weekly syllabi, knowledge domain flashcard decks, quantitative firm profiles, and system pattern blueprint sheets in a single, high-fidelity workstation.

---

## 🚀 Core Features

1. **Obsidian/Notion-Style Study Notebook**
   * **Decoupled Title Architecture**: Study notebook sidebar filenames (the note title) and document paper headings are decoupled. Changing the sidebar tree name does not alter the editor title layout, preserving custom formatting inside the note.
   * **Smart Toggle Collapse**: The tree action header features a state-aware toggle button. It dynamically shifts between "Collapse All" (double-up chevrons) when folders are expanded, and "Expand All" (double-down chevrons) when folders are collapsed.
   * **WYSIWYG Formatting**: Rich-text editing (Bold, Italic, Underline, Headings, Lists, Links).
   * **Coding Sandboxes**: Syntax highlighting for coding snippets (Python, C++, Linux/Bash).
   * **Active Recall Callout Blocks**: Obsidian-style callouts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`).
   * **Image Integrations**: Drag-and-resize inline images with clipboard pasting support.
   * **Canvas Zoom Controls**: Zoom pages (75% to 150%) with responsive reading and writing modes.

2. **Knowledge Domains & Recall Flashcards**
   * **Analytics**: Solved rates, active study streaks, and metrics.
   * **Custom Cards**: Create, edit, and delete recall question cards inside study domains.

3. **Targeted Prep Plan**
   * **6-Week Syllabus**: Customized checklist covering computer architecture, networks, and HFT systems.

4. **Company-Specific Profiles**
   * **Firm Profiles**: Focus topics for companies like Citadel, Optiver, Jane Street, and Google.

5. **High-Performance Industry Blueprints**
   * **System Architectures**: Deep-dives into HFT systems patterns (LMAX Disruptor, Kernel Socket Bypass, CPU Thread Affinity).

---

## 🛠️ Technology Stack & Project Structure

* **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Marked, DOMPurify.
* **Backend**: Node.js, Express, SQLite3, Pino (structured logs), JWT, Bcrypt.js, Helmet.

### Folder Structure
```
src/
├── components/
│   ├── notebook/           # Decoupled text editor & sidebar directory tree
│   │   ├── NotebookTree.jsx
│   │   ├── NotebookHeader.jsx
│   │   ├── NotebookToolbar.jsx
│   │   └── NotebookEditor.jsx
│   ├── dashboard/          # Flashcard review panels & stats
│   ├── shared/             # Glassmorphic modal & alerts
│   └── ...
├── context/
│   └── PrepContext.jsx     # Client state manager & sync pipeline
server/
├── index.js                # Core Express API routes and guards
├── database.js             # SQLite initialization & serialized runners
├── authMiddleware.js       # JWT validation & generation
└── logger.js               # Pino structured file & terminal logger
```

---

## 💻 Local Development

### 1. Installation
Install root and backend dependencies:
```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Run Locally
```bash
# Start Backend (from server/ folder)
npm start

# Start Frontend (from root folder)
npm run dev
```
Open client at `http://localhost:5173/` and backend API at `http://localhost:5001`.
```

---

## 📖 Part 2: Backend API Reference Documentation

All requests except registration and login require a secure JSON Web Token passed in the headers:
`Authorization: Bearer <TOKEN>`

### 1. Authentication Routes

#### `POST /api/auth/register`
* **Description**: Registers a new user, hashes their password, and seeds a blank study state.
* **Request Body**:
  ```json
  {
    "username": "exampleUser",
    "password": "securepassword123"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "message": "User registered and seeded successfully.",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "0dcb5e4e-df66-4a17-800d-24356e80a05f",
      "username": "exampleUser"
    }
  }
  ```

#### `POST /api/auth/login`
* **Description**: Verifies credentials and generates a JWT.
* **Request Body**:
  ```json
  {
    "username": "exampleUser",
    "password": "securepassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "0dcb5e4e-df66-4a17-800d-24356e80a05f",
      "username": "exampleUser"
    }
  }
  ```

#### `POST /api/auth/logout`
* **Description**: Logs the logout event for server audit logs.
* **Success Response (200 OK)**:
  ```json
  { "message": "Logged out successfully." }
  ```

---

### 2. User State Routes

#### `GET /api/user/state`
* **Description**: Retrieves the user's dashboard KPI state, domains list, flashcards, company profiles, and system blueprints.
* **Success Response (200 OK)**:
  ```json
  {
    "streak": 3,
    "lastStudiedDate": "2026-06-06",
    "prepPlan": [],
    "domains": {
      "OS": {
        "name": "OS",
        "progress": 50,
        "categories": {
          "Virtual Memory": [
            { "id": "q-1", "title": "TLB Miss Latency", "status": "review", "answer": "..." }
          ]
        }
      }
    },
    "neetcode": [],
    "companies": [],
    "patterns": []
  }
  ```

#### `POST /api/user/state`
* **Description**: Overwrites/synchronizes the user state (streak, questions, plans, blueprints).
* **Request Body**: Same schema structure as returned in `GET /api/user/state`.
* **Success Response (200 OK)**:
  ```json
  { "message": "Study state synchronised successfully." }
  ```

---

### 3. Notebook Pages Routes

#### `GET /api/notebook/tree`
* **Description**: Fetches all outline nodes of the user and reconstructs them into a tree structure.
* **Success Response (200 OK)**:
  ```json
  {
    "notebookTree": [
      {
        "id": "nb-node-1",
        "title": "Systems Engineering",
        "status": "todo",
        "collapsed": false,
        "body": "",
        "type": "folder",
        "children": [
          {
            "id": "nb-node-2",
            "title": "Linux Kernel Scheduling",
            "status": "solved",
            "collapsed": true,
            "body": "<p>Content...</p>",
            "type": "file",
            "children": []
          }
        ]
      }
    ]
  }
  ```

#### `POST /api/notebook/page`
* **Description**: Creates or updates a specific note node. Upserts on node `id` conflict.
* **Request Body**:
  ```json
  {
    "id": "nb-node-2",
    "parent_id": "nb-node-1",
    "title": "Linux Kernel Scheduling",
    "body": "<p>Updated content</p>",
    "status": "solved",
    "collapsed": true,
    "sort_order": 0,
    "type": "file"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Notebook page updated successfully." }
  ```

#### `DELETE /api/notebook/page/:id`
* **Description**: Recursively deletes a note node and all sub-notes from the database.
* **Success Response (200 OK)**:
  ```json
  { "message": "Notebook page and nested children deleted recursively." }
  ```

#### `POST /api/notebook/import`
* **Description**: Clears previous user pages and restores a full tree structure. Limits payload to 50MB and performs strict validation checks.
* **Success Response (200 OK)**:
  ```json
  { "message": "Notebook restored successfully." }
  ```

---

## 🤖 Part 3: Future Agent / MCP Integration Blueprint

To interface PrepHQ with large language models (LLMs) like Gemini or ChatGPT via an AI Agent or a Model Context Protocol (MCP) server, we must provide atomic APIs. These APIs enable agents to perform reasoning cycles without downloading/uploading the entire global state object.

### 1. Model Context Protocol (MCP) Architectural Overview
```
┌─────────────────┐        MCP (JSON-RPC)       ┌────────────────┐
│   LLM Client    │ ◄─────────────────────────► │   MCP Server   │
│ (Gemini/GPT...) │                             │   (PrepHQ)     │
└─────────────────┘                             └───────┬────────┘
                                                        │ HTTP / DB
                                                        ▼
                                                ┌────────────────┐
                                                │ PrepHQ Backend │
                                                └────────────────┘
```
The MCP server exposes:
1. **Tools**: Executable actions the model can trigger (e.g. `add_flashcard`, `update_note_body`).
2. **Resources**: Static or dynamic data context the model can read (e.g. `notebook://notes-hierarchy`, `flashcard://OS/Virtual-Memory`).
3. **Prompts**: Standard agent operational templates (e.g. `"review-failed-cards"`).

---

### 2. Suggested New APIs to Support Agents

#### `GET /api/agent/status`
* **Description**: Quick diagnostic reporting for the AI agent (e.g. user streak, total cards, solved percentage, notes volume).
* **Success Response (200 OK)**:
  ```json
  {
    "streak": 3,
    "total_flashcards": 124,
    "solved_count": 82,
    "needs_review": 18,
    "total_note_nodes": 45,
    "database_size_kb": 2048
  }
  ```

#### `POST /api/agent/flashcards`
* **Description**: Exposes atomic creation of a flashcard within a domain and category.
* **Request Body**:
  ```json
  {
    "domain": "OS",
    "category": "Virtual Memory",
    "title": "Page Fault Resolution Latency",
    "answer": "Soft page faults: ~1-5 microseconds. Hard page faults (disk swap): ~1-10 milliseconds."
  }
  ```

#### `DELETE /api/agent/flashcards/:id`
* **Description**: Atomically removes a specific card by UUID.

#### `PATCH /api/agent/flashcards/:id`
* **Description**: Updates fields of a single card (status, category, answer).

#### `GET /api/agent/notes/:id`
* **Description**: Returns plain-text markdown of a note (stripping HTML wrappers) to prevent context window bloat.

#### `PATCH /api/agent/notes/:id`
* **Description**: Appends text or edits sections of a note using simple markdown blocks.

---

### 3. Exposing MCP Tools to LLM Agents
Below is the standard JSON Schema definition mapping for tools to register with Gemini/ChatGPT:

```json
[
  {
    "name": "get_study_status",
    "description": "Retrieve study progress analytics, streaks, and flashcard distributions to plan review schedules.",
    "input_schema": { "type": "object", "properties": {} }
  },
  {
    "name": "create_flashcard",
    "description": "Add an active-recall question card to a study category.",
    "input_schema": {
      "type": "object",
      "properties": {
        "domain": { "type": "string", "description": "e.g., OS, Networking, FIX" },
        "category": { "type": "string", "description": "e.g., Memory, Sockets" },
        "title": { "type": "string", "description": "The active recall question" },
        "answer": { "type": "string", "description": "The back-of-card explanation" }
      },
      "required": ["domain", "category", "title", "answer"]
    }
  },
  {
    "name": "append_study_notes",
    "description": "Append markdown explanations or code blocks to a study notebook page.",
    "input_schema": {
      "type": "object",
      "properties": {
        "noteId": { "type": "string", "description": "UUID of the note page node" },
        "contentToAppend": { "type": "string", "description": "Markdown text or pre/code blocks" }
      },
      "required": ["noteId", "contentToAppend"]
    }
  }
]
```

---

## 🛡️ Part 4: Security Impact & Required Updates

Introducing agent connections and hosting the app multi-user creates new attack surfaces. We must tighten security across the stack:

### 1. Authentication & Token Security
* **Current state**: Standard JWTs expire in 7 days.
* **Required Update**:
  * Implement **refresh tokens** stored in HTTP-only, secure, SameSite=Strict cookies to protect against Cross-Site Scripting (XSS).
  * Reduce access token lifespan to 15 minutes.
  * Establish Token Revocation lists in SQLite (using a blacklisted tokens table) for instant user logout.

### 2. CORS & Rate Limiting
* **Current state**: CORS allows origin based on `.env` settings; rate limiter only protects register/login.
* **Required Update**:
  * Set CORS `credentials: true` for HTTP-only cookie validation.
  * Set a global rate limiter for API routes (`/api/user/*` and `/api/notebook/*`) limiting to 200 requests per minute to prevent Denial of Service (DoS) attacks via automated scripts.

### 3. Payload Integrity & Validation
* **Current state**: Import checks check schema bounds up to 50MB, but other fields are unsanitized.
* **Required Update**:
  * Integrate a validation library like **Zod** on the backend to enforce strong schema typing.
  * Enforce strict inputs on all fields. For example, strip HTML tags from titles and markdown bodies using libraries like `sanitize-html` or `dompurify` on the backend before writing to the database.

---

## 🪵 Part 5: Exception Handling & Logging Strategies

Structured, diagnostic logging is vital when autonomous agents start making changes.

### 1. Transaction Context Logging
* **Mechanism**: Every request receives a `Correlation-ID` (UUID) attached in the Express middleware.
* **Pino telemetry integration**:
  ```javascript
  app.use((req, res, next) => {
    req.correlationId = req.header('X-Correlation-ID') || randomUUID();
    req.log = logger.child({ correlationId: req.correlationId });
    next();
  });
  ```
* Every log line printed during that request lifecycle (database queries, validation errors, agent actions) will print containing this `correlationId`. This allows easy debugging across logs.

### 2. SQLite Transaction Level Rollbacks
* In node-sqlite3, queries run concurrently. We must enforce SQLite transaction wrappers when modifying nodes so that parent-child updates are atomic:
  ```javascript
  try {
    await dbRun('BEGIN TRANSACTION');
    // ... insert node child, update parent, reorder siblings ...
    await dbRun('COMMIT');
  } catch (err) {
    await dbRun('ROLLBACK');
    logger.error({ err }, 'Database transaction failed — rolled back changes.');
    throw err;
  }
  ```

### 3. Frontend Global Error boundaries
* React's error boundaries catch runtime rendering exceptions.
* **Optimization**: Send frontend exceptions back to `/api/logs/client` so they write directly to the backend Pino rolling file. This allows admins to catch client-side React rendering issues in production.

---

## ⚡ Part 6: Efficiency & Optimization Opportunities

### 1. Database Layer Enhancements
* **Indexes**: Currently, SQLite lookup queries perform table scans. Add composite indexes:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_pages_user_parent ON notebook_pages(user_id, parent_id);
  CREATE INDEX IF NOT EXISTS idx_state_user ON study_state(user_id);
  ```
* **Write-Ahead Logging (WAL)**: Enable SQLite WAL mode to support parallel readers while a write is occurring:
  ```javascript
  await dbRun('PRAGMA journal_mode = WAL;');
  await dbRun('PRAGMA synchronous = NORMAL;');
  ```
  This increases throughput by 5x-10x for write-heavy client-sync operations.

### 2. Frontend State & Synchronization Tweaks
* **Selective Syncing**: Currently, `PrepContext.jsx` serializes the *entire* dashboard configuration (domains, neetcode, patterns, companies) and pushes it in one large JSON string via `POST /api/user/state`.
  * **Optimization**: Decouple the REST routes into sub-resources (e.g. `POST /api/user/domains`, `POST /api/user/patterns`).
  * Only sync the specific slice of state that changed, reducing bandwidth by over 95%.
* **Vite Production Bundling**: Ensure code-splitting is enabled in `vite.config.js` to separate `react`, `marked`, `dompurify`, and `lucide-react` vendor packages into isolated JS chunks, maximizing HTTP caching.

---

## 📐 Part 7: Layout Standards

To maintain visual consistency and screen real estate efficiency across the PrepHQ workstation, developers must adhere to the following page layout contracts:

### 1. Two-Panel Layout (List / Detail)
* **Usage**: Ideal for resource collections where users browse a flat list of items and view/edit details on the right side.
* **Examples**:
  - **Learning Dashboard**: Knowledge domains / categories -> flashcard lists.
  - **Company Profiles**: Left-side firm search and selection list, middle resize handle, right-side interview rounds timeline and focus topics display.
* **Structure**:
  - **Left Sidebar**: Displays the search input, primary creation button, and navigation item list. Typically resizable between 160px and 480px.
  - **Right Detail View**: Displays detail metadata, structured children/timelines, and edit/delete actions.

### 2. Three-Panel Layout (File-Tree / Editor / Preview)
* **Usage**: Used for complex workspaces where hierarchical navigation, formatting controls, editing canvases, and live-rendered previews are active simultaneously.
* **Examples**:
  - **Study Notebook**: Left-side hierarchical folder tree, middle rich-text editor canvas, right-side live Markdown viewer/inspector or visual preview.
  - **Industry Patterns**: Left-side blueprint list, middle raw Markdown code editor with inline formatting toolbar, right-side live-rendered preview pane.
* **Structure**:
  - **Left Panel**: Navigation and directory/outline browser (collapsible and resizable).
  - **Center Panel**: Input/editing workstation workspace.
  - **Right Panel**: Read-only rendering or compile/preview dashboard block.
