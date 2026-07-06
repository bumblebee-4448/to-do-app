# Todo Codebase Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the current Todo app's hidden correctness bugs, production safety risks, performance limits, resilience gaps, and scale blockers found in the senior review.

**Architecture:** Treat this as staged hardening, not a redesign. First make production data safe and API contracts consistent, then fix client/server data correctness, then improve query scale and UX resilience, then reduce frontend maintenance and bundle weight. Multi-user ownership is intentionally last because it changes the product boundary.

**Tech Stack:** Express 5, Mongoose 9, MongoDB, React 19, Vite 8, React Query 5, React Hook Form, Zod, Radix UI, DayPicker, Vitest, Jest, Supertest.

---

## Priority Order

1. **P0 Data Safety:** DB startup must not silently fall back to memory; API validation and mutation semantics must be correct.
2. **P1 Data Correctness:** Board/list must not hide tasks, optimistic cache must not lie, Kanban move must persist actual order.
3. **P2 Scale And Resilience:** Query/index strategy, pagination behavior, invalid date handling, HTTP error ownership.
4. **P3 UX And Maintainability:** Accessible modal/date picker, less inline styling, smaller chunks, realistic tests.
5. **P4 Scale-Up Boundary:** Introduce user/tenant ownership behind explicit product decisions.

## File Structure Map

- Modify: `server/src/server.ts` - use explicit startup helper instead of inline Mongo fallback.
- Create: `server/src/config/runtimeDb.ts` - resolve MongoDB connection strategy by environment.
- Modify: `server/src/config/db.ts` - keep a single real Mongo connector.
- Modify: `server/src/app.ts` - strict CORS and JSON body limits.
- Modify: `server/src/models/Todo.ts` - add indexes, `position`, and ownership fields in the tasks that introduce those behaviors.
- Modify: `server/src/validations/todoValidation.ts` - align create/patch/list validation.
- Modify: `server/src/controllers/todoController.ts` - atomic update/delete, board-friendly querying, move behavior.
- Modify: `server/src/routes/todoRoutes.ts` - add board/move routes.
- Modify: `server/src/__tests__/todos.test.ts` - API regression coverage.
- Create: `server/src/__tests__/runtimeDb.test.ts` - startup safety tests.
- Modify: `client/src/config/api.ts` - normalize errors without global toast side effects.
- Modify: `client/src/features/todos/api/todosApi.ts` - add board/move API calls.
- Modify: `client/src/features/todos/types.ts` - add board response, `position`, API error types.
- Modify: `client/src/features/todos/hooks/useTodos.ts` - remove unsafe broad optimistic writes.
- Create: `client/src/features/todos/hooks/useBoardTodos.ts` - per-column board queries.
- Modify: `client/src/features/todos/components/TodoDashboard.tsx` - split responsibilities and wire board/list separately.
- Modify: `client/src/features/todos/components/KanbanColumn.tsx` - emit move intent with neighbor IDs.
- Modify: `client/src/features/todos/components/KanbanCard.tsx` - keep drag behavior but stop implying unsupported reorder.
- Modify: `client/src/features/todos/components/TodoList.tsx` - resilient empty page and compact pagination.
- Create: `client/src/features/todos/components/Pagination.tsx` - reusable bounded pagination.
- Create: `client/src/components/ui/Dialog.tsx` - Radix dialog wrapper for task form.
- Modify: `client/src/components/ui/DatePicker.tsx` - clamp positioning, ARIA, invalid-date protection.
- Create: `client/src/utils/dateSafe.ts` - safe parse/format helpers.
- Modify: `client/src/utils/date.ts` - delegate to safe helpers or remove after migration.
- Modify: `client/src/style/global.css` - move repeated inline styling into classes and remove external font import.
- Modify: `client/src/__tests__/App.test.tsx` - remove unrealistic Select mock and add regression tests.
- Create: `client/.env.example` - restore client environment documentation.
- Modify: `README.md` - document production startup, env vars, known operational constraints.

---

### Task 1: P0 Runtime DB Safety

**Files:**
- Create: `server/src/config/runtimeDb.ts`
- Modify: `server/src/server.ts`
- Test: `server/src/__tests__/runtimeDb.test.ts`

- [ ] **Step 1: Write failing tests for production startup safety**

Create `server/src/__tests__/runtimeDb.test.ts`:

```ts
import { resolveDbRuntime } from '../config/runtimeDb';

describe('resolveDbRuntime', () => {
  test('requires MONGO_URI in production', () => {
    expect(() =>
      resolveDbRuntime({
        nodeEnv: 'production',
        mongoUri: undefined,
        allowInMemoryDb: false,
      }),
    ).toThrow('MONGO_URI is required in production');
  });

  test('allows in-memory DB only when explicitly enabled outside production', () => {
    expect(
      resolveDbRuntime({
        nodeEnv: 'development',
        mongoUri: undefined,
        allowInMemoryDb: true,
      }),
    ).toEqual({ kind: 'memory' });
  });

  test('uses configured MongoDB URI when present', () => {
    expect(
      resolveDbRuntime({
        nodeEnv: 'production',
        mongoUri: 'mongodb://localhost:27017/todo-db',
        allowInMemoryDb: false,
      }),
    ).toEqual({ kind: 'mongo', uri: 'mongodb://localhost:27017/todo-db' });
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
cd server
npm test -- runtimeDb.test.ts
```

Expected: FAIL because `server/src/config/runtimeDb.ts` does not exist.

- [ ] **Step 3: Implement explicit DB runtime resolution**

Create `server/src/config/runtimeDb.ts`:

```ts
type ResolveDbRuntimeInput = {
  nodeEnv: string | undefined;
  mongoUri: string | undefined;
  allowInMemoryDb: boolean;
};

export type DbRuntime =
  | { kind: 'mongo'; uri: string }
  | { kind: 'memory' };

export const resolveDbRuntime = ({
  nodeEnv,
  mongoUri,
  allowInMemoryDb,
}: ResolveDbRuntimeInput): DbRuntime => {
  if (mongoUri) {
    return { kind: 'mongo', uri: mongoUri };
  }

  if (nodeEnv === 'production') {
    throw new Error('MONGO_URI is required in production');
  }

  if (allowInMemoryDb) {
    return { kind: 'memory' };
  }

  throw new Error('MONGO_URI is required. Set ALLOW_IN_MEMORY_DB=true for local development only.');
};
```

- [ ] **Step 4: Refactor `server.ts` to use the runtime resolver**

Replace the inline nested fallback logic in `server/src/server.ts` with:

```ts
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from './app';
import connectDB from './config/db';
import { resolveDbRuntime } from './config/runtimeDb';

const port = process.env.PORT || 5000;

const startMemoryDb = async () => {
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'todo-db' },
    binary: { version: '7.0.24' },
  });

  const uri = mongoServer.getUri('todo-db');
  await mongoose.connect(uri);
  console.warn(`Using in-memory MongoDB at ${uri}`);
};

const start = async () => {
  try {
    const runtime = resolveDbRuntime({
      nodeEnv: process.env.NODE_ENV,
      mongoUri: process.env.MONGO_URI,
      allowInMemoryDb: process.env.ALLOW_IN_MEMORY_DB === 'true',
    });

    if (runtime.kind === 'mongo') {
      await connectDB(runtime.uri);
      console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
    } else {
      await startMemoryDb();
    }

    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    console.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

start();
```

- [ ] **Step 5: Verify**

Run:

```bash
cd server
npm run typecheck
npm test -- runtimeDb.test.ts
npm test
```

Expected: typecheck passes, new runtime tests pass, existing API tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/config/runtimeDb.ts server/src/server.ts server/src/__tests__/runtimeDb.test.ts
git commit -m "fix(server): prevent unsafe memory db fallback"
```

---

### Task 2: P0 API Contract And Validation Hardening

**Files:**
- Modify: `server/src/app.ts`
- Modify: `server/src/validations/todoValidation.ts`
- Modify: `server/src/__tests__/todos.test.ts`

- [ ] **Step 1: Add regression tests for create payload validation and CORS/body behavior**

Append to `server/src/__tests__/todos.test.ts`:

```ts
test('rejects invalid status and dueDate during creation', async () => {
  const res = await request(app)
    .post('/api/v1/todos')
    .send({
      title: 'Valid title',
      status: 'archived',
      dueDate: 'not-a-date',
    });

  expect(res.status).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: 'status' }),
      expect.objectContaining({ path: 'dueDate' }),
    ]),
  );
});

test('accepts valid status and dueDate during creation', async () => {
  const res = await request(app)
    .post('/api/v1/todos')
    .send({
      title: 'Create in done column',
      status: 'completed',
      dueDate: new Date(Date.now() + 86_400_000).toISOString(),
    });

  expect(res.status).toBe(201);
  expect(res.body.data.status).toBe('completed');
  expect(res.body.data.dueDate).toBeTruthy();
});
```

- [ ] **Step 2: Run tests and verify the first test fails**

Run:

```bash
cd server
npm test -- todos.test.ts
```

Expected: invalid create validation test fails because `createTodoValidation` does not include `statusRule()` or `dueDateRule()`.

- [ ] **Step 3: Align create validation with editable fields**

Change `server/src/validations/todoValidation.ts`:

```ts
const statusRule = () =>
  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage('Status must be pending, incomplete, or completed');

const createTodoValidation = [
  titleRule(),
  descriptionRule(),
  dueDateRule(),
  statusRule(),
];
```

- [ ] **Step 4: Tighten app middleware**

Change `server/src/app.ts`:

```ts
const allowedOrigin = process.env.CLIENT_ORIGIN;

app.use(cors({
  origin: allowedOrigin ? allowedOrigin.split(',').map((origin) => origin.trim()) : false,
}));
app.use(express.json({ limit: '100kb' }));
```

For local dev, set `CLIENT_ORIGIN=http://localhost:3000` in `server/.env.example`.

- [ ] **Step 5: Verify**

Run:

```bash
cd server
npm run typecheck
npm test
```

Expected: all server tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/app.ts server/src/validations/todoValidation.ts server/src/__tests__/todos.test.ts server/.env.example
git commit -m "fix(server): align validation and cors defaults"
```

---

### Task 3: P0 Atomic Update And Delete

**Files:**
- Modify: `server/src/controllers/todoController.ts`
- Modify: `server/src/__tests__/todos.test.ts`

- [ ] **Step 1: Add deleted-record mutation tests**

Append to `server/src/__tests__/todos.test.ts`:

```ts
test('does not patch a soft-deleted todo', async () => {
  const todo = await createTodo({ title: 'Already deleted' });
  await Todo.findByIdAndUpdate(todo._id, { isDeleted: true, deletedAt: new Date() });

  const res = await request(app)
    .patch(`/api/v1/todos/${todo._id}`)
    .send({ title: 'Should not update' });

  expect(res.status).toBe(404);
  const stored = await Todo.findById(todo._id);
  expect(stored?.title).toBe('Already deleted');
});

test('delete returns 404 for an already soft-deleted todo', async () => {
  const todo = await createTodo({ title: 'Delete once' });
  await request(app).delete(`/api/v1/todos/${todo._id}`);

  const secondDelete = await request(app).delete(`/api/v1/todos/${todo._id}`);

  expect(secondDelete.status).toBe(404);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd server
npm test -- todos.test.ts
```

Expected: at least one new deleted-record test fails with current two-step update.

- [ ] **Step 3: Replace two-step patch/delete with atomic filters**

In `server/src/controllers/todoController.ts`, change patch/delete:

```ts
const patchTodo = async (req: Request<{ id: string }, object, EditableTodoPayload>, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError(404, 'Todo not found');
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    pickEditableFields(req.body),
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  res.status(200).json({ success: true, data: todo });
};

const deleteTodo = async (req: Request<{ id: string }>, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError(404, 'Todo not found');
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { isDeleted: true, deletedAt: new Date() },
    { returnDocument: 'after' },
  );

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  res.status(204).send();
};
```

- [ ] **Step 4: Verify**

Run:

```bash
cd server
npm run typecheck
npm test
```

Expected: all server tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/todoController.ts server/src/__tests__/todos.test.ts
git commit -m "fix(server): make todo mutations atomic"
```

---

### Task 4: P1 Board Data Model And Query Scale

**Files:**
- Modify: `server/src/models/Todo.ts`
- Modify: `server/src/controllers/todoController.ts`
- Modify: `server/src/routes/todoRoutes.ts`
- Modify: `server/src/validations/todoValidation.ts`
- Modify: `server/src/__tests__/todos.test.ts`
- Modify: `client/src/features/todos/types.ts`
- Modify: `client/src/features/todos/api/todosApi.ts`

- [ ] **Step 1: Add server tests for board pagination and ordering**

Append to `server/src/__tests__/todos.test.ts`:

```ts
test('lists board todos by status with pagination metadata', async () => {
  await createTodo({ title: 'Pending one', status: 'pending' });
  await createTodo({ title: 'Pending two', status: 'pending' });
  await createTodo({ title: 'Done one', status: 'completed' });

  const res = await request(app).get('/api/v1/todos?status=pending&page=1&limit=1&sortBy=position&order=asc');

  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(1);
  expect(res.body.pagination.total).toBe(2);
  expect(res.body.pagination.totalPages).toBe(2);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
cd server
npm test -- todos.test.ts
```

Expected: FAIL because `sortBy=position` is not accepted.

- [ ] **Step 3: Add `position` and compound indexes**

Modify `server/src/models/Todo.ts`:

```ts
position: {
  type: Number,
  default: 0,
  index: true,
},
```

After schema definition options, add indexes before export:

```ts
todoSchema.index({ isDeleted: 1, status: 1, position: 1, _id: 1 });
todoSchema.index({ isDeleted: 1, status: 1, createdAt: -1, _id: -1 });
todoSchema.index({ isDeleted: 1, dueDate: 1, _id: 1 });
todoSchema.index({ title: 'text', description: 'text' });
```

- [ ] **Step 4: Allow position sorting**

Modify `server/src/validations/todoValidation.ts`:

```ts
const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'title', 'position'];
```

Modify `server/src/controllers/todoController.ts` type:

```ts
sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'title' | 'position';
```

- [ ] **Step 5: Keep query output stable**

In `getTodos`, compute total pages safely:

```ts
const totalPages = Math.max(Math.ceil(total / limit), 1);
```

Keep response `hasNextPage` and `hasPrevPage` as existing.

- [ ] **Step 6: Add client types and API support**

Modify `client/src/features/todos/types.ts`:

```ts
export type TodoSortBy = 'createdAt' | 'dueDate' | 'title' | 'position';

export interface Todo {
  _id: string;
  title: string;
  description: string;
  status: TodoStatus;
  dueDate?: string | null;
  position?: number;
  createdAt: string;
  updatedAt: string;
}
```

No API path change is needed yet because `getTodos` already accepts `sortBy`.

- [ ] **Step 7: Verify**

Run:

```bash
cd server
npm run typecheck
npm test
cd ../client
npm run typecheck
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add server/src/models/Todo.ts server/src/controllers/todoController.ts server/src/validations/todoValidation.ts server/src/__tests__/todos.test.ts client/src/features/todos/types.ts
git commit -m "feat(todos): add position-aware query model"
```

---

### Task 5: P1 Board Must Not Hide Tasks

**Files:**
- Create: `client/src/features/todos/hooks/useBoardTodos.ts`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Add failing test for more than 10 board tasks**

In `client/src/__tests__/App.test.tsx`, add:

```tsx
test('board shows pagination per column instead of hiding tasks after the first page', async () => {
  const user = userEvent.setup();
  apiState.nextId = 1;
  apiState.todos = Array.from({ length: 12 }, (_, index) =>
    makeTodo({
      title: `Pending board task ${String(index + 1).padStart(2, '0')}`,
      description: `Board task ${index + 1}`,
      status: 'pending',
    }),
  );

  render(<App />);

  const listColumn = await screen.findByRole('region', { name: /danh sách công việc/i });
  expect(within(listColumn).getByText('Pending board task 01')).toBeInTheDocument();
  expect(within(listColumn).queryByText('Pending board task 11')).not.toBeInTheDocument();

  await user.click(within(listColumn).getByRole('button', { name: /trang sau/i }));

  expect(await within(listColumn).findByText('Pending board task 11')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run client test and verify failure**

Run:

```bash
cd client
npm test -- App.test.tsx
```

Expected: FAIL because board columns have no per-column pagination buttons.

- [ ] **Step 3: Create board query hook**

Create `client/src/features/todos/hooks/useBoardTodos.ts`:

```ts
import { useMemo, useState } from 'react';
import { useTodos } from './useTodos';
import type { TodoFilters, TodoStatus } from '../types';

const boardStatuses: TodoStatus[] = ['pending', 'incomplete', 'completed'];

export const useBoardTodos = (baseFilters: Omit<TodoFilters, 'status' | 'limit'>) => {
  const [pages, setPages] = useState<Record<TodoStatus, number>>({
    pending: 1,
    incomplete: 1,
    completed: 1,
  });

  const queries = {
    pending: useTodos({ ...baseFilters, status: 'pending', limit: 10, page: pages.pending }),
    incomplete: useTodos({ ...baseFilters, status: 'incomplete', limit: 10, page: pages.incomplete }),
    completed: useTodos({ ...baseFilters, status: 'completed', limit: 10, page: pages.completed }),
  };

  const columns = useMemo(
    () => ({
      list: queries.pending.data?.data ?? [],
      incomplete: queries.incomplete.data?.data ?? [],
      done: queries.completed.data?.data ?? [],
    }),
    [queries.pending.data, queries.incomplete.data, queries.completed.data],
  );

  const setColumnPage = (status: TodoStatus, page: number) => {
    setPages((current) => ({ ...current, [status]: page }));
  };

  return { boardStatuses, columns, queries, pages, setColumnPage };
};
```

- [ ] **Step 4: Wire `TodoDashboard` board to independent column queries**

In `TodoDashboard.tsx`, keep list using current `useTodos(filters)`, but replace board `columns` derivation with `useBoardTodos` using:

```ts
const boardFilters = useMemo(
  () => ({
    search: debouncedSearch,
    sortBy: 'position' as const,
    order: 'asc' as const,
  }),
  [debouncedSearch],
);

const board = useBoardTodos(boardFilters);
```

Pass each column its own query pagination metadata and `onPageChange`.

- [ ] **Step 5: Add pagination props to `KanbanColumn`**

Extend `KanbanColumnProps`:

```ts
pagination?: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
};
```

Render previous/next buttons in the column footer when `pagination.totalPages > 1`.

- [ ] **Step 6: Verify**

Run:

```bash
cd client
npm run typecheck
npm test
```

Expected: client typecheck and tests pass.

- [ ] **Step 7: Commit**

```bash
git add client/src/features/todos/hooks/useBoardTodos.ts client/src/features/todos/components/TodoDashboard.tsx client/src/features/todos/components/KanbanColumn.tsx client/src/__tests__/App.test.tsx
git commit -m "fix(client): paginate board columns independently"
```

---

### Task 6: P1 Remove Unsafe Broad Optimistic Cache Writes

**Files:**
- Modify: `client/src/features/todos/hooks/useTodos.ts`
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Add regression test for filtered cache correctness**

Add to `client/src/__tests__/App.test.tsx`:

```tsx
test('does not show newly created pending todos inside completed filter', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /bộ lọc/i }));
  await user.selectOptions(screen.getByLabelText(/trạng thái/i), 'completed');
  expect(await screen.findByText('Buy groceries')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /thêm việc mới/i }));
  await user.type(screen.getByLabelText(/tiêu đề/i), 'Pending should not leak');
  await user.click(screen.getByRole('button', { name: /^thêm công việc$/i }));

  await waitFor(() => {
    expect(screen.queryByText('Pending should not leak')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test and verify failure or flaky behavior**

Run:

```bash
cd client
npm test -- App.test.tsx
```

Expected: current broad optimistic cache can leak data into nonmatching caches.

- [ ] **Step 3: Remove `onMutate` cache mutation from create/update/patch/delete**

In `client/src/features/todos/hooks/useTodos.ts`, replace mutation hooks with server-confirmed invalidation:

```ts
export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSuccess<Todo>, Error, TodoCreatePayload>({
    mutationFn: (payload) => todosApi.createTodo(payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSuccess<Todo>, Error, { id: string; payload: TodoUpdatePayload }>({
    mutationFn: ({ id, payload }) => todosApi.updateTodo(id, payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const usePatchTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSuccess<Todo>, Error, { id: string; payload: TodoPatchPayload }>({
    mutationFn: ({ id, payload }) => todosApi.patchTodo(id, payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => todosApi.deleteTodo(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};
```

- [ ] **Step 4: Verify**

Run:

```bash
cd client
npm run typecheck
npm test
```

Expected: tests pass and no filtered cache leak remains.

- [ ] **Step 5: Commit**

```bash
git add client/src/features/todos/hooks/useTodos.ts client/src/__tests__/App.test.tsx
git commit -m "fix(client): remove unsafe optimistic todo cache writes"
```

---

### Task 7: P1 Persist Kanban Reorder

**Files:**
- Modify: `server/src/controllers/todoController.ts`
- Modify: `server/src/routes/todoRoutes.ts`
- Modify: `server/src/validations/todoValidation.ts`
- Modify: `server/src/__tests__/todos.test.ts`
- Modify: `client/src/features/todos/api/todosApi.ts`
- Modify: `client/src/features/todos/hooks/useTodos.ts`
- Modify: `client/src/features/todos/components/KanbanColumn.tsx`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`

- [ ] **Step 1: Add server move endpoint test**

Append to `server/src/__tests__/todos.test.ts`:

```ts
test('moves a todo to a column and persists a position between neighbors', async () => {
  const first = await createTodo({ title: 'First pending', status: 'pending', position: 1000 });
  const second = await createTodo({ title: 'Second pending', status: 'pending', position: 2000 });
  const moving = await createTodo({ title: 'Move me', status: 'incomplete', position: 1000 });

  const res = await request(app)
    .patch(`/api/v1/todos/${moving._id}/move`)
    .send({
      status: 'pending',
      beforeId: String(second._id),
      afterId: String(first._id),
    });

  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe('pending');
  expect(res.body.data.position).toBeGreaterThan(first.position);
  expect(res.body.data.position).toBeLessThan(second.position);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
cd server
npm test -- todos.test.ts
```

Expected: FAIL because `/move` route does not exist.

- [ ] **Step 3: Add move validation**

In `server/src/validations/todoValidation.ts`:

```ts
const moveTodoValidation = [
  ...validateId,
  statusRule().exists().withMessage('Status is required'),
  body('beforeId').optional({ nullable: true }).custom((value: string) => Types.ObjectId.isValid(value)).withMessage('Invalid beforeId'),
  body('afterId').optional({ nullable: true }).custom((value: string) => Types.ObjectId.isValid(value)).withMessage('Invalid afterId'),
];
```

Export `moveTodoValidation`.

- [ ] **Step 4: Add move controller**

In `server/src/controllers/todoController.ts`:

```ts
const getNeighborPosition = async (id: string | null | undefined, status: TodoStatus) => {
  if (!id) return null;
  const todo = await Todo.findOne({ _id: id, status, isDeleted: { $ne: true } }).select('position').lean();
  return typeof todo?.position === 'number' ? todo.position : null;
};

const computePosition = (afterPosition: number | null, beforePosition: number | null) => {
  if (afterPosition !== null && beforePosition !== null) return (afterPosition + beforePosition) / 2;
  if (afterPosition !== null) return afterPosition + 1000;
  if (beforePosition !== null) return beforePosition - 1000;
  return Date.now();
};

const moveTodo = async (
  req: Request<{ id: string }, object, { status: TodoStatus; beforeId?: string | null; afterId?: string | null }>,
  res: Response,
) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError(404, 'Todo not found');
  }

  const afterPosition = await getNeighborPosition(req.body.afterId, req.body.status);
  const beforePosition = await getNeighborPosition(req.body.beforeId, req.body.status);
  const position = computePosition(afterPosition, beforePosition);

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { status: req.body.status, position },
    { returnDocument: 'after', runValidators: true },
  );

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  res.status(200).json({ success: true, data: todo });
};
```

Export `moveTodo`.

- [ ] **Step 5: Add route**

In `server/src/routes/todoRoutes.ts`, before `/:id` route:

```ts
router
  .route('/:id/move')
  .patch(moveTodoValidation, validateRequest, asyncHandler(moveTodo));
```

- [ ] **Step 6: Update client move API**

In `client/src/features/todos/types.ts`:

```ts
export type TodoMovePayload = {
  status: TodoStatus;
  beforeId?: string | null;
  afterId?: string | null;
};
```

In `client/src/features/todos/api/todosApi.ts`:

```ts
moveTodo: (id: string, payload: TodoMovePayload) =>
  api.patch<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}/move`, cleanPayload(payload)),
```

- [ ] **Step 7: Emit neighbor IDs from Kanban column**

In `KanbanColumn`, change drop callback signature to:

```ts
onDropTodo: (todoId: string, column: KanbanColumnId, beforeId: string | null, afterId: string | null) => void;
```

In `handleDrop`:

```ts
const beforeId = todos[idx]?._id ?? null;
const afterId = idx > 0 ? todos[idx - 1]?._id ?? null : null;
onDropTodo(todoId, column, beforeId, afterId);
```

- [ ] **Step 8: Wire dashboard move mutation**

In `TodoDashboard.tsx`, map column to status and call `moveTodo` mutation:

```ts
const handleDropTodo = (todoId: string, column: KanbanColumnId, beforeId: string | null, afterId: string | null) => {
  const statusByColumn: Record<KanbanColumnId, TodoStatus> = {
    list: 'pending',
    incomplete: 'incomplete',
    done: 'completed',
  };

  moveTodo.mutate(
    { id: todoId, payload: { status: statusByColumn[column], beforeId, afterId } },
    { onSuccess: () => toast.success('Đã di chuyển công việc!') },
  );
};
```

- [ ] **Step 9: Verify**

Run:

```bash
cd server
npm run typecheck
npm test
cd ../client
npm run typecheck
npm test
```

Expected: server and client pass.

- [ ] **Step 10: Commit**

```bash
git add server/src/controllers/todoController.ts server/src/routes/todoRoutes.ts server/src/validations/todoValidation.ts server/src/__tests__/todos.test.ts client/src/features/todos/types.ts client/src/features/todos/api/todosApi.ts client/src/features/todos/hooks/useTodos.ts client/src/features/todos/components/KanbanColumn.tsx client/src/features/todos/components/TodoDashboard.tsx
git commit -m "feat(todos): persist kanban moves"
```

---

### Task 8: P2 Pagination Resilience

**Files:**
- Create: `client/src/features/todos/components/Pagination.tsx`
- Modify: `client/src/features/todos/components/TodoList.tsx`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Add delete-last-item regression test**

Add to `client/src/__tests__/App.test.tsx`:

```tsx
test('returns to a valid page after deleting the last item on the last page', async () => {
  const user = userEvent.setup();
  apiState.nextId = 1;
  apiState.todos = Array.from({ length: 11 }, (_, index) =>
    makeTodo({
      title: `Delete pagination task ${String(index + 1).padStart(2, '0')}`,
      description: `Task ${index + 1}`,
      status: 'incomplete',
    }),
  );

  render(<App />);
  await user.click(screen.getByRole('tab', { name: /danh sách/i }));
  await user.click(await screen.findByRole('button', { name: '2' }));
  await user.click(screen.getByRole('button', { name: /xóa Delete pagination task 11/i }));
  await user.click(screen.getByRole('button', { name: /^xóa$/i }));

  expect(await screen.findByText('Delete pagination task 01')).toBeInTheDocument();
});
```

- [ ] **Step 2: Create bounded pagination component**

Create `client/src/features/todos/components/Pagination.tsx`:

```tsx
type PaginationProps = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
};

const getVisiblePages = (page: number, totalPages: number) => {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const Pagination = ({ page, totalPages, hasNextPage, hasPrevPage, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button className="btn btn--secondary" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)} aria-label="Trang trước">
        Trước
      </button>
      {getVisiblePages(page, totalPages).map((pageNum) => (
        <button
          key={pageNum}
          className={`pagination__page ${pageNum === page ? 'pagination__page--active' : ''}`}
          onClick={() => onPageChange(pageNum)}
          aria-current={pageNum === page ? 'page' : undefined}
        >
          {pageNum}
        </button>
      ))}
      <button className="btn btn--secondary" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)} aria-label="Trang sau">
        Sau
      </button>
    </nav>
  );
};
```

- [ ] **Step 3: Clamp current list page when total pages shrink**

In `TodoDashboard.tsx`, add:

```ts
useEffect(() => {
  const totalPages = todosQuery.data?.pagination?.totalPages;
  if (view === 'list' && totalPages && page > totalPages) {
    setPage(totalPages);
  }
}, [page, todosQuery.data?.pagination?.totalPages, view]);
```

- [ ] **Step 4: Use `Pagination` from `TodoList`**

Replace inline page rendering in `TodoList.tsx` with:

```tsx
<Pagination
  page={page}
  totalPages={totalPages}
  hasNextPage={hasNextPage}
  hasPrevPage={hasPrevPage}
  onPageChange={onPageChange}
/>
```

- [ ] **Step 5: Verify**

Run:

```bash
cd client
npm run typecheck
npm test
```

Expected: client checks pass.

- [ ] **Step 6: Commit**

```bash
git add client/src/features/todos/components/Pagination.tsx client/src/features/todos/components/TodoList.tsx client/src/features/todos/components/TodoDashboard.tsx client/src/__tests__/App.test.tsx
git commit -m "fix(client): keep pagination on valid pages"
```

---

### Task 9: P2 HTTP Error Ownership

**Files:**
- Modify: `client/src/config/api.ts`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Add unit expectation through UI: one toast owner only**

In `client/src/__tests__/App.test.tsx`, mock `sonner` at top:

```tsx
const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', async () => {
  const actual = await vi.importActual<typeof import('sonner')>('sonner');
  return { ...actual, toast: toastMock };
});
```

Add test:

```tsx
test('shows mutation error toast from component ownership only', async () => {
  const { todosApi } = await import('../features/todos/api/todosApi');
  vi.mocked(todosApi.createTodo).mockRejectedValueOnce(new Error('Server rejected create'));

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /thêm việc mới/i }));
  await user.type(screen.getByLabelText(/tiêu đề/i), 'Will fail');
  await user.click(screen.getByRole('button', { name: /^thêm công việc$/i }));

  await waitFor(() => {
    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(toastMock.error).toHaveBeenCalledWith('Server rejected create');
  });
});
```

- [ ] **Step 2: Remove toast side effect from Axios interceptor**

Change `client/src/config/api.ts`:

```ts
import axios from 'axios';

export class ApiError extends Error {
  status?: number;
  errors: unknown[];

  constructor(message: string, status?: number, errors: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new ApiError(message, error.response?.status, error.response?.data?.errors || []));
  },
);
```

- [ ] **Step 3: Put error toast in component mutation callbacks**

In `TodoDashboard.tsx`, for each mutation call that has `onSuccess`, add:

```ts
onError: (error) => {
  toast.error(error.message);
},
```

Keep query error inline in `TodoList` only.

- [ ] **Step 4: Verify**

Run:

```bash
cd client
npm run typecheck
npm test
```

Expected: one error toast per failed mutation.

- [ ] **Step 5: Commit**

```bash
git add client/src/config/api.ts client/src/features/todos/components/TodoDashboard.tsx client/src/__tests__/App.test.tsx
git commit -m "fix(client): move api error toasts to callers"
```

---

### Task 10: P2 Safe Date Handling

**Files:**
- Create: `client/src/utils/dateSafe.ts`
- Modify: `client/src/utils/date.ts`
- Modify: `client/src/components/ui/DatePicker.tsx`
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Add date utility tests through UI or create utility test**

Create `client/src/utils/dateSafe.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { formatDueDateSafe, isOverdueSafe, toInputDateSafe } from './dateSafe';

describe('safe date helpers', () => {
  test('does not throw on invalid dates', () => {
    expect(toInputDateSafe('not-a-date')).toBe('');
    expect(formatDueDateSafe('not-a-date')).toBe('Ngày không hợp lệ');
    expect(isOverdueSafe('not-a-date', 'incomplete')).toBe(false);
  });
});
```

- [ ] **Step 2: Implement safe helpers**

Create `client/src/utils/dateSafe.ts`:

```ts
import type { TodoStatus } from '../features/todos/types';

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toInputDateSafe = (value?: string | null) => {
  const date = parseDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
};

export const formatDueDateSafe = (value?: string | null) => {
  const date = parseDate(value);
  if (!value) return 'Không có hạn chót';
  if (!date) return 'Ngày không hợp lệ';

  return new Intl.DateTimeFormat('vi', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const isOverdueSafe = (value: string | null | undefined, status: TodoStatus) => {
  const dueDate = parseDate(value);
  if (!dueDate || status === 'completed') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};
```

- [ ] **Step 3: Delegate old date exports**

Modify `client/src/utils/date.ts`:

```ts
export {
  formatDueDateSafe as formatDueDate,
  isOverdueSafe as isOverdue,
  toInputDateSafe as toInputDate,
} from './dateSafe';
```

- [ ] **Step 4: Guard DatePicker selectedDate**

In `DatePicker.tsx`, replace:

```ts
const selectedDate = value ? new Date(value) : undefined;
```

with:

```ts
const parsedValue = value ? new Date(value) : null;
const selectedDate = parsedValue && !Number.isNaN(parsedValue.getTime()) ? parsedValue : undefined;
```

- [ ] **Step 5: Verify**

Run:

```bash
cd client
npm run typecheck
npm test
```

Expected: utility tests and app tests pass.

- [ ] **Step 6: Commit**

```bash
git add client/src/utils/dateSafe.ts client/src/utils/dateSafe.test.ts client/src/utils/date.ts client/src/components/ui/DatePicker.tsx
git commit -m "fix(client): guard invalid todo dates"
```

---

### Task 11: P3 Accessible Task Dialog And Date Picker

**Files:**
- Add dependency: `@radix-ui/react-dialog`
- Create: `client/src/components/ui/Dialog.tsx`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`
- Modify: `client/src/components/ui/DatePicker.tsx`
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Install dialog dependency**

Run:

```bash
cd client
npm install @radix-ui/react-dialog
```

- [ ] **Step 2: Create dialog wrapper**

Create `client/src/components/ui/Dialog.tsx`:

```tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogContent = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="modal-overlay" />
    <DialogPrimitive.Content className={cn('modal-panel modal-in', className)} {...props}>
      {children}
      <DialogPrimitive.Close className="icon-btn dialog__close" aria-label="Đóng cửa sổ">
        <X size={16} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
```

- [ ] **Step 3: Replace custom form portal**

In `TodoDashboard.tsx`, replace `createPortal` task modal with:

```tsx
<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
  <DialogContent>
    <TodoForm
      editingTodo={editingTodo}
      isSaving={createTodo.isPending || updateTodo.isPending}
      onCancelEdit={() => setIsFormOpen(false)}
      onSubmit={handleSubmit}
    />
  </DialogContent>
</Dialog>
```

Remove `createPortal` import from `TodoDashboard.tsx`.

- [ ] **Step 4: Improve DatePicker ARIA and viewport clamp**

In `DatePicker.tsx`, add to trigger button:

```tsx
aria-haspopup="dialog"
aria-expanded={isOpen}
aria-label={placeholder}
```

Clamp left in `updateCoords`:

```ts
const popoverWidth = 320;
const left = Math.min(
  Math.max(8, rect.left + window.scrollX),
  window.innerWidth - popoverWidth - 8,
);
```

Use `left` in `setCoords`.

- [ ] **Step 5: Add accessibility regression test**

Add to `App.test.tsx`:

```tsx
test('task form opens as an accessible dialog and closes with escape', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /thêm việc mới/i }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Verify**

Run:

```bash
cd client
npm run typecheck
npm test
```

Expected: checks pass.

- [ ] **Step 7: Commit**

```bash
git add client/package.json client/package-lock.json client/src/components/ui/Dialog.tsx client/src/features/todos/components/TodoDashboard.tsx client/src/components/ui/DatePicker.tsx client/src/__tests__/App.test.tsx
git commit -m "fix(client): use accessible task dialog"
```

---

### Task 12: P3 Bundle And Asset Cleanup

**Files:**
- Modify: `client/src/style/global.css`
- Modify: icon imports in `client/src/features/todos/components/*.tsx`
- Modify: `client/src/components/ui/Toaster.tsx`
- Modify: `client/package.json`

- [ ] **Step 1: Measure baseline**

Run:

```bash
cd client
npm run build
```

Record current output: JS chunk currently around `677 kB` minified and `209 kB` gzip.

- [ ] **Step 2: Remove Google Fonts runtime import**

Delete this line from `client/src/style/global.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap");
```

Change font tokens:

```css
--font-sans: "Inter", "SF Pro Text", system-ui, sans-serif;
--font-mono: "SF Mono", ui-monospace, monospace;
```

- [ ] **Step 3: Use one icon library**

Replace `@phosphor-icons/react` imports with `lucide-react` equivalents:

```tsx
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  List,
  ListChecks,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
```

After all Phosphor usages are removed:

```bash
cd client
npm uninstall @phosphor-icons/react
```

- [ ] **Step 4: Verify bundle**

Run:

```bash
cd client
npm run typecheck
npm test
npm run build
```

Expected: build passes and the main JS chunk warning is reduced or removed. If the warning remains, keep the measured number in the commit body.

- [ ] **Step 5: Commit**

```bash
git add client/src client/package.json client/package-lock.json
git commit -m "perf(client): reduce icon and font weight"
```

---

### Task 13: P3 Split Dashboard And Remove Inline Style Sprawl

**Files:**
- Create: `client/src/features/todos/components/DashboardTopbar.tsx`
- Create: `client/src/features/todos/components/DashboardFilters.tsx`
- Create: `client/src/features/todos/components/DashboardViewTabs.tsx`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`
- Modify: `client/src/style/global.css`
- Modify: `client/src/features/todos/components/TodoFilters.tsx`

- [ ] **Step 1: Delete or replace stale `TodoFilters`**

If `TodoFilters.tsx` is no longer imported after `DashboardFilters` is created, delete it:

```bash
git rm client/src/features/todos/components/TodoFilters.tsx
```

- [ ] **Step 2: Extract topbar**

Create `DashboardTopbar.tsx`:

```tsx
import { List, Moon, Sun } from 'lucide-react';

type DashboardTopbarProps = {
  isSidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
};

export const DashboardTopbar = ({ isSidebarCollapsed, theme, onOpenSidebar, onToggleTheme }: DashboardTopbarProps) => (
  <header className="topbar heading-enter">
    <button
      className={`sidebar-toggle-btn ${isSidebarCollapsed ? 'sidebar-toggle-btn--collapsed' : ''}`}
      onClick={onOpenSidebar}
      aria-label="Open sidebar"
    >
      <List size={18} />
    </button>
    <h1 className="topbar__title">Danh sách việc cần làm</h1>
    <div className="topbar__spacer" />
    <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  </header>
);
```

- [ ] **Step 3: Extract tabs and filters**

Create `DashboardViewTabs.tsx` and `DashboardFilters.tsx` with props only; move inline styles into CSS classes `.dashboard-actions-row`, `.dashboard-actions-right`, `.filter-panel`, `.topbar__title`, `.topbar__spacer`.

- [ ] **Step 4: Keep behavior unchanged**

`TodoDashboard.tsx` should remain responsible for state and mutations, but render through extracted components.

- [ ] **Step 5: Verify**

Run:

```bash
cd client
npm run typecheck
npm test
```

Expected: no behavior regressions.

- [ ] **Step 6: Commit**

```bash
git add client/src/features/todos/components client/src/style/global.css
git commit -m "refactor(client): split dashboard controls"
```

---

### Task 14: P3 Test Realism

**Files:**
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Remove custom Select mock**

Delete the entire `vi.mock('../components/ui/Select', ...)` block from `App.test.tsx`.

- [ ] **Step 2: Update filter test to use real Radix select behavior**

Replace native select interaction:

```tsx
await user.selectOptions(screen.getByLabelText(/trạng thái/i), 'completed');
```

with:

```tsx
await user.click(screen.getByRole('combobox', { name: /trạng thái/i }));
await user.click(await screen.findByRole('option', { name: /hoàn thành/i }));
```

- [ ] **Step 3: Verify**

Run:

```bash
cd client
npm test -- App.test.tsx
npm run typecheck
```

Expected: tests pass against real Select behavior.

- [ ] **Step 4: Commit**

```bash
git add client/src/__tests__/App.test.tsx
git commit -m "test(client): cover real select behavior"
```

---

### Task 15: P3 Environment And Docs Reproducibility

**Files:**
- Create: `client/.env.example`
- Modify: `server/.env.example`
- Modify: `README.md`

- [ ] **Step 1: Restore client env example**

Create `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

- [ ] **Step 2: Update server env example**

Modify `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/todo-db
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
ALLOW_IN_MEMORY_DB=false
```

- [ ] **Step 3: Document production startup**

In `README.md`, add a short production warning:

```md
### Production Runtime Rules

- `MONGO_URI` is required when `NODE_ENV=production`.
- The server must not use in-memory MongoDB in production.
- Set `CLIENT_ORIGIN` to the deployed frontend origin. Do not use `*` for production CORS.
- `ALLOW_IN_MEMORY_DB=true` is only for local development demos.
```

- [ ] **Step 4: Verify docs and git status**

Run:

```bash
git status --short
```

Expected: `client/.env.example`, `server/.env.example`, and `README.md` are staged in the next commit only.

- [ ] **Step 5: Commit**

```bash
git add client/.env.example server/.env.example README.md
git commit -m "docs: document runtime environment"
```

---

### Task 16: P4 Tenant/User Ownership Boundary

**Files:**
- Modify: `server/src/models/Todo.ts`
- Modify: `server/src/controllers/todoController.ts`
- Modify: `server/src/__tests__/todos.test.ts`
- Create or modify in the same P4 branch: auth middleware and client session wiring

- [ ] **Step 1: Decide the product boundary before code**

Choose one implementation path and write it into `docs/superpowers/specs/`:

```md
# Todo Ownership Decision

Decision: todos are owned by authenticated users.
API rule: every list/get/create/update/delete operation must be scoped by `ownerId`.
Migration rule: existing local todos can be assigned to a development owner during migration.
```

- [ ] **Step 2: Add owner field in a migration-safe way**

Add to `Todo.ts` only after auth/session behavior is chosen:

```ts
ownerId: {
  type: Schema.Types.ObjectId,
  required: true,
  index: true,
},
```

Add compound indexes:

```ts
todoSchema.index({ ownerId: 1, isDeleted: 1, status: 1, position: 1, _id: 1 });
todoSchema.index({ ownerId: 1, isDeleted: 1, createdAt: -1, _id: -1 });
```

- [ ] **Step 3: Scope every controller filter**

Every server query must include:

```ts
const ownerId = req.user.id;
```

and every Mongo filter must include:

```ts
ownerId,
```

- [ ] **Step 4: Add cross-owner security tests**

In `todos.test.ts`, add tests that create two owners and prove one owner cannot read, patch, move, or delete the other owner's todo.

- [ ] **Step 5: Verify**

Run:

```bash
cd server
npm run typecheck
npm test
```

Expected: cross-owner tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/models/Todo.ts server/src/controllers/todoController.ts server/src/__tests__/todos.test.ts docs/superpowers/specs
git commit -m "feat(server): scope todos by owner"
```

---

## Final Verification Checklist

- [ ] `cd server && npm run typecheck`
- [ ] `cd server && npm test`
- [ ] `cd server && npm run build`
- [ ] `cd server && npm audit --omit=dev`
- [ ] `cd client && npm run typecheck`
- [ ] `cd client && npm test`
- [ ] `cd client && npm run build`
- [ ] `cd client && npm audit --omit=dev`
- [ ] Manual browser check: create, edit, delete, filter, search, list pagination, board pagination, drag between columns, reorder within one column, invalid API date display, Escape closes form dialog.
- [ ] Production config check: `NODE_ENV=production` without `MONGO_URI` must fail startup.

## Execution Recommendation

Execute Tasks 1-3 first as a single P0 branch. Then Tasks 4-8 as a data correctness branch. Then Tasks 9-15 as UX/maintenance branches. Treat Task 16 as a separate product-scale branch because it changes the ownership model and should not be mixed with bug fixes.
