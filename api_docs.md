# PrepHQ Backend API Reference Documentation

All requests except registration and login require a secure JSON Web Token passed in the headers:
`Authorization: Bearer <TOKEN>`

---

## 1. Authentication Routes

### `POST /api/auth/register`
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

### `POST /api/auth/login`
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

### `POST /api/auth/logout`
* **Description**: Logs the logout event for server audit logs.
* **Success Response (200 OK)**:
  ```json
  { "message": "Logged out successfully." }
  ```

### `GET /api/auth/me`
* **Description**: Retrieves the authenticated user profile object.
* **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "0dcb5e4e-df66-4a17-800d-24356e80a05f",
      "username": "exampleUser"
    }
  }
  ```

### `POST /api/user/change-password`
* **Description**: Resets the current user's password.
* **Request Body**:
  ```json
  {
    "currentPassword": "oldPassword123",
    "newPassword": "newSecurePassword456"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Password updated successfully." }
  ```

---

## 2. User State & Granular Sync Routes

### `GET /api/user/state`
* **Description**: Retrieves the user's dashboard streak, domains list, flashcards, company profiles, and system blueprints.
* **Success Response (200 OK)**:
  ```json
  {
    "streak": 3,
    "lastStudiedDate": "2026-06-06",
    "prepPlan": [],
    "domains": {},
    "neetcode": [],
    "companies": [],
    "patterns": []
  }
  ```

### `POST /api/user/state`
* **Description**: Full overwrite/synchronization of user study configurations (Fallback/Force Save).
* **Request Body**: Same schema structure as returned in `GET /api/user/state`.
* **Success Response (200 OK)**:
  ```json
  { "message": "Study state synchronised successfully." }
  ```

### `PATCH /api/user/state/streak`
* **Description**: Update streak details.
* **Request Body**:
  ```json
  {
    "streak": 5,
    "lastStudiedDate": "2026-06-12"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Streak synchronized successfully." }
  ```

### `PATCH /api/user/state/prep-plan`
* **Description**: Granular sync for targeted weekly syllabus progress.
* **Request Body**:
  ```json
  { "prepPlan": [...] }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Prep plan synchronized successfully." }
  ```

### `PATCH /api/user/state/domains`
* **Description**: Granular sync for knowledge domains and flashcards.
* **Request Body**:
  ```json
  { "domains": {...} }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Domains synchronized successfully." }
  ```

### `PATCH /api/user/state/neetcode`
* **Description**: Granular sync for LeetCode status list.
* **Request Body**:
  ```json
  { "neetcode": [...] }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Leetcode problems synchronized successfully." }
  ```

### `PATCH /api/user/state/companies`
* **Description**: Granular sync for company review sequences.
* **Request Body**:
  ```json
  { "companies": [...] }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Company profiles synchronized successfully." }
  ```

### `PATCH /api/user/state/patterns`
* **Description**: Granular sync for architecture pattern blueprints.
* **Request Body**:
  ```json
  { "patterns": [...] }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Blueprints synchronized successfully." }
  ```

---

## 3. Notebook Pages Routes

### `GET /api/notebook/tree`
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
        "children": [...]
      }
    ]
  }
  ```

### `POST /api/notebook/page`
* **Description**: Creates or updates a specific note node. Upserts on node `id` conflict.
* **Request Body**:
  ```json
  {
    "id": "nb-node-2",
    "parent_id": "nb-node-1",
    "title": "Linux Kernel Scheduling",
    "body": "<p>Content...</p>",
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

### `DELETE /api/notebook/page/:id`
* **Description**: Recursively deletes a note node and all sub-notes from the database. (Wrapped in a SQLite Transaction rollback block).
* **Success Response (200 OK)**:
  ```json
  { "message": "Notebook page and nested children deleted recursively." }
  ```

### `POST /api/notebook/import`
* **Description**: Clears previous user pages and restores a full tree structure. Wrapped in a SQLite transaction with auto-rollback on inserts failure.
* **Success Response (200 OK)**:
  ```json
  { "message": "Notebook restored successfully." }
  ```

### `POST /api/notebook/reorder`
* **Description**: Updates outline nodes parent references and sort ordering. Wrapped in a transaction.
* **Request Body**:
  ```json
  {
    "reorderedNodes": [
      { "id": "nb-node-2", "parent_id": "nb-node-1", "sort_order": 1 }
    ]
  }
  ```
* **Success Response (200 OK)**:
  ```json
  { "message": "Outline tree reordered successfully." }
  ```

---

## 4. Diagnostics & Ingestion Routes

### `POST /api/logs/client`
* **Description**: Standard ingestion route for React rendering error stack traces.
* **Request Body**:
  ```json
  {
    "error": { "message": "Cannot read property 'name' of undefined", "stack": "..." },
    "info": { "componentStack": "\n    in DomainTabs\n    in App" }
  }
  ```
* **Success Response (204 No Content)**
