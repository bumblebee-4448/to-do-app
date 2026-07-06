# To-Do List Application

This project is a full-stack **To-Do List** application built with modern web technologies, featuring a responsive user interface and a robust backend. The project is structured as a monorepo split into a `client` (frontend) and a `server` (backend).

---

## 1. Project Overview

### Features
* **Task Management (CRUD):** Add, edit, view, and delete tasks.
* **Toggle Status:** Mark tasks as completed or pending.
* **Search & Filters:** Search tasks by keywords and filter by completion status.
* **Pagination & Sorting:** Efficiently handle large numbers of tasks with support for page-based data fetching and sorting by fields (e.g., creation date, due date).
* **Responsive Design:** Clean, modern, responsive UI optimized for both desktop and mobile devices.
* **Dark/Light Mode:** Toggle between themes, with settings persisted automatically in localStorage.
* **Optimistic Updates:** Instant UI updates when completing or deleting tasks, with automatic rollback if the API request fails.

### Technology Stack
#### Frontend (Client)
* **Framework:** ReactJS with TypeScript.
* **Routing:** React Router.
* **State & Theme Management:** Zustand (persisted state).
* **HTTP Client:** Axios (configured with timeout and interceptors).
* **Server State & Caching:** React Query (`@tanstack/react-query`) for caching, synchronization, and pagination.
* **Forms & Validation:** React Hook Form combined with Zod schemas.
* **Styling:** TailwindCSS 4.
* **Testing:** Vitest & React Testing Library.

#### Backend (Server)
* **Runtime:** Node.js.
* **Framework:** ExpressJS with TypeScript.
* **Database:** MongoDB with Mongoose ORM.
* **Validation:** `express-validator` middleware.
* **Testing:** Jest & Supertest.

---

## 2. How to Run the Project

### Prerequisites
* **Node.js** (v24.x or higher recommended).
* **MongoDB** installed locally (running on `mongodb://localhost:27017`) or a **MongoDB Atlas** cloud database connection string.

---

### Step 1: Set Up and Run the Backend (Server)

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `server` directory and add the following configuration:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/todo-db
   CLIENT_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ALLOW_IN_MEMORY_DB=false
   ```
   *Note: If you do not have MongoDB installed locally, you can set `ALLOW_IN_MEMORY_DB=true` to run the backend using an in-memory database (temporary database that clears when the server stops).*

4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   *The server will start and listen on `http://localhost:5000`.*

---

### Step 2: Set Up and Run the Frontend (Client)

1. Open a new terminal window/tab and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `client` directory and specify the API endpoint:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The client application will start on `http://localhost:3000`.*

---

### Step 3: Run Tests & Checks

You can run automated tests and TypeScript checks for both parts of the application:

* **Backend Type Check:**
  ```bash
  cd server
  npm run typecheck
  ```

* **Backend Unit Tests:**
  ```bash
  cd server
  npm test
  ```

* **Frontend Type Check:**
  ```bash
  cd client
  npm run typecheck
  ```

* **Frontend Unit & Integration Tests:**
  ```bash
  cd client
  npm test
  ```

* **Build Frontend for Production:**
  ```bash
  cd client
  npm run build
  ```
