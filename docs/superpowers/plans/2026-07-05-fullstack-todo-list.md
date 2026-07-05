# Full-Stack Todo List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete README-specified Todo List application with an Express/MongoDB backend and a Vite/React frontend.

**Architecture:** The backend exposes `/api/v1/todos` as a validated REST API backed by Mongoose. The frontend is a feature-based React app that uses React Query for server state, Axios for API calls, React Hook Form and Zod for validation, Zustand for persisted theme state, and Tailwind-powered local UI primitives.

**Tech Stack:** Node.js, Express, MongoDB, Mongoose, express-validator, Jest, Supertest, mongodb-memory-server, Vite, React, React Router, React Query, Axios, Zustand, React Hook Form, Zod, Tailwind CSS, Vitest, React Testing Library.

---

## File Structure

Create or modify these files:

- Modify: `README.md` with final local run instructions if implementation details differ from the initial brief.
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/src/app.js`
- Create: `server/src/server.js`
- Create: `server/src/config/db.js`
- Create: `server/src/models/Todo.js`
- Create: `server/src/controllers/todoController.js`
- Create: `server/src/routes/todoRoutes.js`
- Create: `server/src/validations/todoValidation.js`
- Create: `server/src/middlewares/asyncHandler.js`
- Create: `server/src/middlewares/errorHandler.js`
- Create: `server/src/middlewares/notFound.js`
- Create: `server/src/middlewares/validateRequest.js`
- Create: `server/src/__tests__/todos.test.js`
- Create: `client/package.json`
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/postcss.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/.env.example`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/index.css`
- Create: `client/src/config/api.js`
- Create: `client/src/config/queryClient.js`
- Create: `client/src/stores/themeStore.js`
- Create: `client/src/hooks/useDebounce.js`
- Create: `client/src/features/todos/api/todosApi.js`
- Create: `client/src/features/todos/hooks/useTodos.js`
- Create: `client/src/features/todos/schemas/todoSchema.js`
- Create: `client/src/features/todos/components/TodoDashboard.jsx`
- Create: `client/src/features/todos/components/TodoFilters.jsx`
- Create: `client/src/features/todos/components/TodoForm.jsx`
- Create: `client/src/features/todos/components/TodoItem.jsx`
- Create: `client/src/features/todos/components/TodoList.jsx`
- Create: `client/src/components/ui/Button.jsx`
- Create: `client/src/components/ui/Input.jsx`
- Create: `client/src/components/ui/Textarea.jsx`
- Create: `client/src/components/ui/Select.jsx`
- Create: `client/src/components/ui/Badge.jsx`
- Create: `client/src/components/ui/Card.jsx`
- Create: `client/src/components/ui/Checkbox.jsx`
- Create: `client/src/utils/cn.js`
- Create: `client/src/utils/date.js`
- Create: `client/src/test/setup.js`
- Create: `client/src/__tests__/App.test.jsx`

## Task 1: Backend Package And RED API Tests

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/src/__tests__/todos.test.js`

- [ ] **Step 1: Create backend package manifest**

Use this script and dependency shape:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "cross-env NODE_ENV=test jest --runInBand"
  }
}
```

- [ ] **Step 2: Write failing backend tests**

Create `server/src/__tests__/todos.test.js` with tests that assert:

```javascript
expect(res.body).toMatchObject({
  success: true,
  pagination: {
    page: 1,
    limit: 2,
    total: 3,
    totalPages: 2,
    hasNextPage: true,
    hasPrevPage: false,
  },
});
```

Also cover create validation, search, status filter, PUT update, PATCH status toggle, missing todo `404`, and DELETE `204`.

- [ ] **Step 3: Run backend tests to verify RED**

Run: `cd server && npm test`

Expected: FAIL because `src/app.js`, `Todo`, routes, and controllers do not exist yet.

- [ ] **Step 4: Commit backend RED test state**

```bash
git add server/package.json server/.env.example server/src/__tests__/todos.test.js
git commit -m "test: define todo API behavior"
```

## Task 2: Backend Implementation

**Files:**
- Create: all backend implementation files listed in File Structure.
- Modify: `server/src/__tests__/todos.test.js` only if the RED failure reveals a test setup issue rather than a product behavior issue.

- [ ] **Step 1: Implement Express app wiring**

Create `src/app.js` with CORS, JSON parsing, `/api/v1/todos`, health check at `/health`, not-found fallback, and centralized error handling.

- [ ] **Step 2: Implement database and model**

Create `src/config/db.js` and `src/models/Todo.js`. The model must enforce `title`, `description`, `priority`, `dueDate`, `status`, and timestamps.

- [ ] **Step 3: Implement validation middleware**

Create `src/validations/todoValidation.js` and `src/middlewares/validateRequest.js`. Use express-validator rules for create, update, patch, and list query parameters.

- [ ] **Step 4: Implement controllers and routes**

Create `todoController.js` and `todoRoutes.js`. List must support `page`, `limit`, `search`, `status`, `sortBy`, `order`, and return pagination metadata.

- [ ] **Step 5: Run backend tests to verify GREEN**

Run: `cd server && npm test`

Expected: PASS with all backend API tests passing.

- [ ] **Step 6: Commit backend implementation**

```bash
git add server
git commit -m "feat: implement todo REST API"
```

## Task 3: Frontend Package, Tooling, And RED UI Tests

**Files:**
- Create: frontend package/config/test files listed in File Structure.

- [ ] **Step 1: Create frontend package manifest and configs**

Use Vite scripts:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 3000",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Write failing UI tests**

Create `client/src/__tests__/App.test.jsx` with tests that assert:

```javascript
expect(screen.getByRole('heading', { name: /today's work/i })).toBeInTheDocument();
```

Also cover adding a todo through the form, validation message for short title, toggling completion, and search/filter controls using a mocked API boundary.

- [ ] **Step 3: Run frontend tests to verify RED**

Run: `cd client && npm test`

Expected: FAIL because `App.jsx`, components, hooks, and API files do not exist yet.

- [ ] **Step 4: Commit frontend RED test state**

```bash
git add client/package.json client/src/__tests__/App.test.jsx client/src/test/setup.js client/vite.config.js client/tailwind.config.js client/postcss.config.js client/index.html client/.env.example
git commit -m "test: define todo dashboard behavior"
```

## Task 4: Frontend Implementation

**Files:**
- Create: all frontend implementation files listed in File Structure.
- Modify: `client/src/__tests__/App.test.jsx` only if the RED failure reveals a test setup issue rather than a product behavior issue.

- [ ] **Step 1: Implement app shell and providers**

Create `main.jsx`, `App.jsx`, `queryClient.js`, and global CSS. Wrap the app with `QueryClientProvider` and `BrowserRouter`.

- [ ] **Step 2: Implement API and todo hooks**

Create `api.js`, `todosApi.js`, and `useTodos.js`. Use `useInfiniteQuery`, optimistic mutation cache updates, rollback on error, and invalidation after settle.

- [ ] **Step 3: Implement validation and form**

Create `todoSchema.js` and `TodoForm.jsx`. Use React Hook Form, Zod resolver, title/description/priority/due-date fields, create mode, and edit mode.

- [ ] **Step 4: Implement filters and list**

Create `TodoDashboard.jsx`, `TodoFilters.jsx`, `TodoList.jsx`, and `TodoItem.jsx`. Include search, status filter, sort field, sort direction, load more, empty/loading/error states, edit, delete, and toggle interactions.

- [ ] **Step 5: Implement local UI primitives and utilities**

Create Button, Input, Textarea, Select, Badge, Card, Checkbox, `cn`, and date formatting helpers. Use lucide-react icons where useful.

- [ ] **Step 6: Run frontend tests to verify GREEN**

Run: `cd client && npm test`

Expected: PASS with all frontend behavior tests passing.

- [ ] **Step 7: Commit frontend implementation**

```bash
git add client
git commit -m "feat: implement todo dashboard"
```

## Task 5: Documentation And End-To-End Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update run instructions**

Ensure README mentions:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/todo-db
NODE_ENV=development
```

and:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

- [ ] **Step 2: Run backend verification**

Run: `cd server && npm test`

Expected: PASS.

- [ ] **Step 3: Run frontend verification**

Run: `cd client && npm test`

Expected: PASS.

- [ ] **Step 4: Run frontend production build**

Run: `cd client && npm run build`

Expected: PASS and creates `client/dist`.

- [ ] **Step 5: Commit docs and verification fixes**

```bash
git add README.md server client
git commit -m "docs: update local run instructions"
```

## Self-Review Checklist

- [ ] Backend routes match the approved spec.
- [ ] Response shapes match the approved spec.
- [ ] Client validation and server validation enforce the same business rules.
- [ ] Optimistic mutations rollback previous React Query cache on error.
- [ ] Dark mode is persisted with Zustand.
- [ ] UI uses flat surfaces, thin borders, and no gradients.
- [ ] Backend tests pass.
- [ ] Frontend tests pass.
- [ ] Frontend build passes.
