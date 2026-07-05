# TypeScript Latest Stack Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the full-stack Todo List implementation from JavaScript to TypeScript while upgrading package dependencies to the latest npm versions verified on July 5, 2026.

**Architecture:** Preserve the existing client/server monorepo and runtime behavior. Add strict TypeScript configs, convert backend Express/Mongoose/Jest files to `.ts`, convert frontend React/Vite/Vitest files to `.ts/.tsx`, and add `typecheck` scripts as required verification gates.

**Tech Stack:** TypeScript 6.0.3, Node.js 24, Express 5.2.1, Mongoose 9.7.3, Jest 30.4.2, ts-jest 29.4.11, Vite 8.1.3, React 19.2.7, React Router 7.18.1, Tailwind CSS 4.3.2, Vitest 4.1.9, React Testing Library 16.3.2.

---

## File Structure

- Modify: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/jest.config.cjs`
- Rename: `server/src/**/*.js` to `server/src/**/*.ts`
- Rename: `server/src/__tests__/todos.test.js` to `server/src/__tests__/todos.test.ts`
- Modify: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/tsconfig.node.json`
- Modify: `client/vite.config.js` to `client/vite.config.ts`
- Modify: `client/tailwind.config.js` or remove it if Tailwind 4 no longer needs it
- Rename: `client/src/**/*.js` to `client/src/**/*.ts`
- Rename: `client/src/**/*.jsx` to `client/src/**/*.tsx`
- Modify: `client/src/index.css` for Tailwind 4 import style
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-05-todo-list-fullstack-design.md`

## Task 1: Backend TypeScript Conversion

**Files:**
- Modify: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/jest.config.cjs`
- Rename and modify: all backend source/test files.

- [ ] **Step 1: Upgrade backend packages to latest**

Run:

```bash
cd server
npm install express@latest mongoose@latest express-validator@latest cors@latest dotenv@latest morgan@latest
npm install -D typescript@latest tsx@latest ts-jest@latest jest@latest cross-env@latest nodemon@latest supertest@latest mongodb-memory-server@latest @types/node@latest @types/express@latest @types/cors@latest @types/morgan@latest @types/jest@latest @types/supertest@latest
```

- [ ] **Step 2: Add TypeScript scripts and configs**

`server/package.json` scripts must include:

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/server.js",
  "test": "cross-env NODE_ENV=test jest --runInBand",
  "typecheck": "tsc -p tsconfig.json --noEmit"
}
```

- [ ] **Step 3: Convert backend source and tests**

Move files to `.ts`, replace CommonJS imports/exports with TypeScript imports/exports, define request/response/error/todo types, and keep the REST API behavior unchanged.

- [ ] **Step 4: Verify backend**

Run:

```bash
cd server
npm run typecheck
npm test
npm run build
npm audit
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit backend TypeScript conversion**

```bash
git add server
git commit -m "refactor: convert backend to TypeScript"
```

## Task 2: Frontend TypeScript Conversion

**Files:**
- Modify: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/tsconfig.node.json`
- Rename and modify: all frontend source/test files.
- Modify: Vite/Tailwind config for latest package versions.

- [ ] **Step 1: Upgrade frontend packages to latest**

Run:

```bash
cd client
npm install react@latest react-dom@latest react-router-dom@latest @tanstack/react-query@latest axios@latest zustand@latest react-hook-form@latest @hookform/resolvers@latest zod@latest lucide-react@latest
npm install -D typescript@latest vite@latest vitest@latest @vitejs/plugin-react@latest jsdom@latest @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest @types/react@latest @types/react-dom@latest @types/node@latest tailwindcss@latest @tailwindcss/vite@latest
```

- [ ] **Step 2: Add TypeScript scripts and configs**

`client/package.json` scripts must include:

```json
{
  "dev": "vite --host 0.0.0.0 --port 3000",
  "build": "tsc -b && vite build",
  "preview": "vite preview --host 0.0.0.0 --port 3000",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc -b"
}
```

- [ ] **Step 3: Convert frontend source and tests**

Move files to `.ts/.tsx`, add domain API types for todos and pagination, type component props, mutation payloads, API responses, and test mocks.

- [ ] **Step 4: Migrate Tailwind to latest package setup**

Use Tailwind CSS 4 via `@tailwindcss/vite` in `vite.config.ts` and `@import "tailwindcss";` in `src/index.css`.

- [ ] **Step 5: Verify frontend**

Run:

```bash
cd client
npm run typecheck
npm test
npm run build
npm audit
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit frontend TypeScript conversion**

```bash
git add client
git commit -m "refactor: convert frontend to TypeScript"
```

## Task 3: Documentation And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-05-todo-list-fullstack-design.md`

- [ ] **Step 1: Update documentation**

State that the project is TypeScript-first and uses latest verified packages. Replace `.js/.jsx` examples with `.ts/.tsx` paths.

- [ ] **Step 2: Run final verification**

Run:

```bash
cd server && npm run typecheck && npm test && npm run build && npm audit
cd client && npm run typecheck && npm test && npm run build && npm audit
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit docs**

```bash
git add README.md docs/superpowers/specs/2026-07-05-todo-list-fullstack-design.md docs/superpowers/plans/2026-07-05-typescript-latest-refactor.md
git commit -m "docs: document TypeScript stack"
```

## Self-Review Checklist

- [ ] No `.js` or `.jsx` app source files remain under `server/src` or `client/src`.
- [ ] Backend `typecheck`, `test`, `build`, and `audit` pass.
- [ ] Frontend `typecheck`, `test`, `build`, and `audit` pass.
- [ ] Runtime behavior remains equivalent to the JavaScript implementation.
- [ ] README and spec describe TypeScript paths and commands.
