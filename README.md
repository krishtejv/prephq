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

6. **Appearance & Settings (Personal Center)**
   * **Theming**: Dark and light modes, accent color selections, text typography size control, and glassmorphism styling toggle.
   * **Data Portability**: Export all study progress and notebooks into a unified Markdown outline or standalone static HTML reader.

---

## 🛠️ Technology Stack & Project Structure

* **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Marked, DOMPurify.
* **Backend**: Node.js, Express, SQLite3, Pino (structured logs), JWT, Bcrypt.js, Helmet, Express-Rate-Limit.

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
│   ├── ErrorBoundary.jsx   # Client-side render crash guard
│   ├── LoginScreen.jsx     # User authentication UI
│   ├── PersonalCenter.jsx  # Workspace settings & exporters
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
# Install frontend packages
npm install

# Install backend packages
cd server
npm install
```

### 2. Run Locally
Start the database server and frontend application in parallel:
```bash
# Start Backend (from server/ folder)
npm start  # Or "npm run dev" for nodemon live reloading

# Start Frontend (from root folder in another terminal)
npm run dev
```
Open your client at `http://localhost:5173/` and backend API at `http://localhost:5001`.

---

## 🐳 Multi-User Homelab Backend & Docker Hosting

PrepHQ features a lightweight, high-performance Express & SQLite backend, perfect for homelabs, Raspberry Pis, or server containers. Multiple users can register secure profiles with isolated learning paths, synchronized outlines, and flashcard metrics.

### 🏗️ Relational Schema Structure (SQLite)
* **`users`:** Holds user profiles, secure `bcryptjs` password hashes, and registration timestamps.
* **`study_state`:** Stores user-specific flashcard decks, company profiles, system blueprints, streaks, and syllabus weeks as structured JSON configurations.
* **`notebook_pages`:** Stores recursive study outline pages in isolated relational database rows.

### 🚀 Docker Compose Deployment (Recommended)
Run PrepHQ easily in a home lab or VPS with the provided multi-container Docker orchestration:

#### 1. Setup Data Directory
Create the target local volume directory:
```bash
mkdir -p server/data
```

#### 2. Run Container Stack
Spin up the front-end Nginx bundle and Node backend service in detached background mode:
```bash
docker compose up --build -d
```

#### 3. Access the Workstation
* **Workstation Client UI:** Connect to `http://localhost` (Port `80`).
* **API backend endpoints:** Connect to `http://localhost:5001`.
