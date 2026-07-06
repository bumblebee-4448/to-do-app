# Todo Next Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining Todo app work: stabilize MongoDB Compass visibility, fix the failing frontend test, wire the view switcher, expose load-more pagination, and add useful Tasks and Chart views.

**Architecture:** Keep the existing full-stack shape. Backend keeps REST and MongoDB ownership; frontend keeps React Query server state, local view state, and feature-level Todo components. Avoid broad refactors: add small view components and reuse `TodoList`, `TodoItem`, and existing hooks.

**Tech Stack:** Express 5, Mongoose, mongodb-memory-server, React 19, TypeScript, React Query 5, React Hook Form, Zod, Vitest, React Testing Library.

---

## File Structure

- Modify: `server/src/server.ts`
  - Ensure fallback in-memory MongoDB connects to `todo-db` instead of defaulting to `test`.
  - Log the active MongoDB database and URI for Compass-friendly debugging.
- Modify: `README.md`
  - Document the current local Compass URI and the in-memory database caveat.
- Modify: `client/src/__tests__/App.test.tsx`
  - Fix the stale heading assertion.
  - Add tests for the view switcher and load-more list behavior.
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`
  - Add active view state.
  - Replace static tab buttons with real buttons.
  - Lower page size from `100` to `10`.
  - Render Board, Tasks, Chart, and List views conditionally.
- Create: `client/src/features/todos/components/TodoGroupedView.tsx`
  - Render grouped todo sections for the "Cong viec" tab.
- Create: `client/src/features/todos/components/TodoStatsView.tsx`
  - Render lightweight KPI and distribution views for the "Bieu do" tab.

---

### Task 1: Stabilize MongoDB Compass Database Name

**Files:**
- Modify: `server/src/server.ts`
- Modify: `README.md`

- [ ] **Step 1: Reproduce the current mismatch**

Run this while the backend dev server is running:

```powershell
cd D:\PROJECT\to-do-list\server
@'
const mongoose = require('mongoose');

(async () => {
  for (const uri of [
    'mongodb://127.0.0.1:27017/todo-db?directConnection=true',
    'mongodb://127.0.0.1:27017/test?directConnection=true',
  ]) {
    const conn = await mongoose.createConnection(uri).asPromise();
    const count = await conn.db.collection('todos').countDocuments();
    console.log(JSON.stringify({ uri, db: conn.name, todos: count }));
    await conn.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@ | node -
```

Expected before the fix: records may appear under `test.todos` instead of `todo-db.todos`.

- [ ] **Step 2: Update fallback URI construction**

In `server/src/server.ts`, replace:

```ts
mongoUri = mongoServer.getUri();
```

with:

```ts
mongoUri = mongoServer.getUri('todo-db');
```

- [ ] **Step 3: Log the active database after every successful connection**

In `server/src/server.ts`, after the fallback `await mongoose.connect(mongoUri);`, add:

```ts
console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
```

Also after the normal `await connectDB(mongoUri);`, add:

```ts
console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
```

The relevant block should become:

```ts
try {
  console.log('Attempting to connect to MongoDB...');
  await connectDB(mongoUri);
  console.log('Connected to MongoDB successfully!');
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
} catch (error) {
  console.warn('Could not connect to MongoDB server. Falling back to in-memory MongoDB database...');

  let mongoServer;
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'todo-db',
      },
      binary: {
        version: '7.0.24',
      },
    });
  } catch (err) {
    console.warn('Port 27017 might be in use, starting in-memory database on a random port...');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'todo-db',
      },
      binary: {
        version: '7.0.24',
      },
    });
  }

  mongoUri = mongoServer.getUri('todo-db');
  console.log('=========================================');
  console.log('IN-MEMORY MONGODB SERVER STARTED!');
  console.log('Connection Link for MongoDB Compass:');
  console.log(`   ${mongoUri}`);
  console.log('=========================================');

  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
}
```

- [ ] **Step 4: Restart backend and verify the DB name**

Stop the current backend dev process, then run:

```powershell
cd D:\PROJECT\to-do-list\server
npm run dev
```

Expected log includes:

```text
Connected to MongoDB database: todo-db
```

- [ ] **Step 5: Seed one verification record**

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/todos `
  -ContentType 'application/json' `
  -Body '{"title":"Compass database verification","description":"Should appear under todo-db.todos","priority":"low"}'
```

- [ ] **Step 6: Verify Compass URI data from Node**

```powershell
cd D:\PROJECT\to-do-list\server
@'
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/todo-db?directConnection=true');
  const count = await mongoose.connection.db.collection('todos').countDocuments();
  console.log(JSON.stringify({ db: mongoose.connection.name, collection: 'todos', count }));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@ | node -
```

Expected:

```json
{"db":"todo-db","collection":"todos","count":1}
```

- [ ] **Step 7: Update README Compass note**

Add this under the local MongoDB setup section in `README.md`:

````md
### MongoDB Compass

For the local development database, use:

```text
mongodb://127.0.0.1:27017/todo-db?directConnection=true
```

If the server falls back to `mongodb-memory-server`, the database is temporary and is cleared when that server process stops.
````

- [ ] **Step 8: Commit**

```powershell
git add server/src/server.ts README.md
git commit -m "fix: align local mongodb database name"
```

---

### Task 2: Fix the Stale Frontend Heading Test

**Files:**
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Run the focused failing test**

```powershell
cd D:\PROJECT\to-do-list\client
npm test -- src/__tests__/App.test.tsx -t "renders the working dashboard"
```

Expected before the fix: fails because it looks for `design for landing page`.

- [ ] **Step 2: Replace the stale heading assertion**

In `client/src/__tests__/App.test.tsx`, replace:

```ts
expect(screen.getByRole('heading', { name: /design for landing page/i })).toBeInTheDocument();
```

with:

```ts
expect(screen.getByRole('heading', { name: /danh sách việc cần làm/i })).toBeInTheDocument();
```

- [ ] **Step 3: Run the focused test again**

```powershell
cd D:\PROJECT\to-do-list\client
npm test -- src/__tests__/App.test.tsx -t "renders the working dashboard"
```

Expected: the focused test passes.

- [ ] **Step 4: Run the full frontend test suite**

```powershell
cd D:\PROJECT\to-do-list\client
npm test
```

Expected: all current frontend tests pass.

- [ ] **Step 5: Commit**

```powershell
git add client/src/__tests__/App.test.tsx
git commit -m "test: update todo dashboard heading assertion"
```

---

### Task 3: Wire the Dashboard View Switcher and List Load-More

**Files:**
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`

- [ ] **Step 1: Add imports and the dashboard view type**

In `TodoDashboard.tsx`, add the `TodoList` import:

```ts
import { TodoList } from './TodoList';
```

Below the imports, add:

```ts
type DashboardView = 'board' | 'tasks' | 'chart' | 'list';

const dashboardViews: Array<{ value: DashboardView; label: string }> = [
  { value: 'board', label: 'Bảng' },
  { value: 'tasks', label: 'Công việc' },
  { value: 'chart', label: 'Biểu đồ' },
  { value: 'list', label: 'Danh sách' },
];
```

- [ ] **Step 2: Add active view state**

Inside `TodoDashboard`, near the other `useState` calls, add:

```ts
const [view, setView] = useState<DashboardView>('board');
```

- [ ] **Step 3: Use a real page size**

In the `filters` object, replace:

```ts
limit: 100,
```

with:

```ts
limit: 10,
```

- [ ] **Step 4: Replace static tab markup**

Replace:

```tsx
<div className="view-tabs">
  <button className="view-tab view-tab--active">Bảng</button>
  <button className="view-tab">Công việc</button>
  <button className="view-tab">Biểu đồ</button>
  <button className="view-tab">Danh sách</button>
</div>
```

with:

```tsx
<div className="view-tabs" role="tablist" aria-label="Chế độ hiển thị">
  {dashboardViews.map((item) => (
    <button
      key={item.value}
      type="button"
      role="tab"
      aria-selected={view === item.value}
      className={`view-tab ${view === item.value ? 'view-tab--active' : ''}`}
      onClick={() => setView(item.value)}
    >
      {item.label}
    </button>
  ))}
</div>
```

- [ ] **Step 5: Extract the existing Kanban section into `renderBoard`**

Above `return (` in `TodoDashboard`, add:

```tsx
const renderBoard = () => (
  <section className="kanban-board">
    <KanbanColumn
      id="planned-col"
      title="Lên kế hoạch"
      icon={<Square size={16} weight="fill" style={{ color: '#a1a1aa' }} />}
      todos={columns.planned}
      isLoading={todosQuery.isLoading}
      onDelete={handleDelete}
      onEdit={handleOpenEdit}
      onToggle={handleToggle}
      onAddTask={() => handleOpenCreate('planned')}
    />

    <KanbanColumn
      id="inprogress-col"
      title="Đang thực hiện"
      icon={<Sparkle size={16} weight="fill" style={{ color: '#f59e0b' }} />}
      todos={columns.inProgress}
      isLoading={todosQuery.isLoading}
      onDelete={handleDelete}
      onEdit={handleOpenEdit}
      onToggle={handleToggle}
      onAddTask={() => handleOpenCreate('inprogress')}
    />

    <KanbanColumn
      id="done-col"
      title="Hoàn thành"
      icon={<CheckCircle size={16} weight="fill" style={{ color: '#22c55e' }} />}
      todos={columns.done}
      isLoading={todosQuery.isLoading}
      onDelete={handleDelete}
      onEdit={handleOpenEdit}
      onToggle={handleToggle}
    />

    <KanbanColumn
      id="onhold-col"
      title="Tạm hoãn"
      icon={<Gear size={16} weight="fill" style={{ color: '#f97316' }} />}
      todos={columns.onHold}
      isLoading={todosQuery.isLoading}
      onDelete={handleDelete}
      onEdit={handleOpenEdit}
      onToggle={handleToggle}
      onAddTask={() => handleOpenCreate('onhold')}
    />
  </section>
);
```

- [ ] **Step 6: Add `renderList`**

Above `return (` in `TodoDashboard`, add:

```tsx
const renderList = () => (
  <section style={{ padding: '8px 24px 24px' }}>
    <TodoList
      error={todosQuery.error}
      hasNextPage={Boolean(todosQuery.hasNextPage)}
      isError={todosQuery.isError}
      isFetchingNextPage={todosQuery.isFetchingNextPage}
      isLoading={todosQuery.isLoading}
      todos={todos}
      onDelete={handleDelete}
      onEdit={handleOpenEdit}
      onFetchNextPage={() => {
        void todosQuery.fetchNextPage();
      }}
      onToggle={handleToggle}
    />
  </section>
);
```

- [ ] **Step 7: Add `renderContent` with temporary working fallbacks**

Above `return (` in `TodoDashboard`, add:

```tsx
const renderContent = () => {
  if (view === 'list') {
    return renderList();
  }

  if (view === 'tasks') {
    return renderList();
  }

  if (view === 'chart') {
    return renderBoard();
  }

  return renderBoard();
};
```

Task 4 and Task 5 replace the temporary `tasks` and `chart` fallbacks with real views.

- [ ] **Step 8: Replace the hard-coded Kanban section in JSX**

Replace the existing `<section className="kanban-board">...</section>` block with:

```tsx
{renderContent()}
```

- [ ] **Step 9: Verify TypeScript**

```powershell
cd D:\PROJECT\to-do-list\client
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 10: Commit**

```powershell
git add client/src/features/todos/components/TodoDashboard.tsx
git commit -m "feat: wire todo dashboard view switcher"
```

---

### Task 4: Add the Tasks Grouped View

**Files:**
- Create: `client/src/features/todos/components/TodoGroupedView.tsx`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`

- [ ] **Step 1: Create `TodoGroupedView.tsx`**

Create `client/src/features/todos/components/TodoGroupedView.tsx` with:

```tsx
import type { Todo } from '../types';
import { TodoItem } from './TodoItem';

type TodoGroupedViewProps = {
  todos: Todo[];
  isLoading: boolean;
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onToggle: (todo: Todo) => void;
};

const groups = [
  { key: 'high', title: 'Ưu tiên cao' },
  { key: 'medium', title: 'Ưu tiên trung bình' },
  { key: 'low', title: 'Ưu tiên thấp' },
] as const;

export const TodoGroupedView = ({
  todos,
  isLoading,
  onDelete,
  onEdit,
  onToggle,
}: TodoGroupedViewProps) => {
  if (isLoading) {
    return (
      <section style={{ padding: '8px 24px 24px' }} aria-label="Đang tải nhóm công việc">
        <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
      </section>
    );
  }

  return (
    <section
      aria-label="Công việc theo mức ưu tiên"
      style={{
        display: 'grid',
        gap: 16,
        padding: '8px 24px 24px',
      }}
    >
      {groups.map((group) => {
        const items = todos.filter((todo) => todo.priority === group.key);

        return (
          <div key={group.key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>
                {group.title}
              </h2>
              <span className="kanban-col__count">{items.length}</span>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {items.length ? (
                items.map((todo) => (
                  <TodoItem
                    key={todo._id}
                    todo={todo}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onToggle={onToggle}
                  />
                ))
              ) : (
                <div className="kanban-col__empty">Không có công việc</div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};
```

- [ ] **Step 2: Import the grouped view in `TodoDashboard.tsx`**

```ts
import { TodoGroupedView } from './TodoGroupedView';
```

- [ ] **Step 3: Add `renderTasks`**

Above `renderContent`, add:

```tsx
const renderTasks = () => (
  <TodoGroupedView
    todos={todos}
    isLoading={todosQuery.isLoading}
    onDelete={handleDelete}
    onEdit={handleOpenEdit}
    onToggle={handleToggle}
  />
);
```

- [ ] **Step 4: Use the real Tasks view**

In `renderContent`, replace:

```tsx
if (view === 'tasks') {
  return renderList();
}
```

with:

```tsx
if (view === 'tasks') {
  return renderTasks();
}
```

- [ ] **Step 5: Verify TypeScript**

```powershell
cd D:\PROJECT\to-do-list\client
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```powershell
git add client/src/features/todos/components/TodoDashboard.tsx client/src/features/todos/components/TodoGroupedView.tsx
git commit -m "feat: add grouped todo tasks view"
```

---

### Task 5: Add the Chart / Stats View

**Files:**
- Create: `client/src/features/todos/components/TodoStatsView.tsx`
- Modify: `client/src/features/todos/components/TodoDashboard.tsx`

- [ ] **Step 1: Create `TodoStatsView.tsx`**

Create `client/src/features/todos/components/TodoStatsView.tsx` with:

```tsx
import type { Todo } from '../types';

type TodoStatsViewProps = {
  todos: Todo[];
};

const pct = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

export const TodoStatsView = ({ todos }: TodoStatsViewProps) => {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.status === 'completed').length;
  const pending = total - completed;
  const high = todos.filter((todo) => todo.priority === 'high').length;
  const medium = todos.filter((todo) => todo.priority === 'medium').length;
  const low = todos.filter((todo) => todo.priority === 'low').length;
  const completion = pct(completed, total);

  const bars = [
    { label: 'Cao', value: high, color: 'var(--color-danger)' },
    { label: 'Trung bình', value: medium, color: '#1f6c9f' },
    { label: 'Thấp', value: low, color: '#346538' },
  ];

  return (
    <section
      aria-label="Biểu đồ công việc"
      style={{
        display: 'grid',
        gap: 16,
        padding: '8px 24px 24px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        }}
      >
        <StatCard label="Tổng công việc" value={total} />
        <StatCard label="Đang chờ" value={pending} />
        <StatCard label="Hoàn thành" value={completed} />
        <StatCard label="Tỷ lệ hoàn thành" value={`${completion}%`} />
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 16,
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>
          Phân bố mức ưu tiên
        </h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {bars.map((bar) => (
            <div key={bar.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 5,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{bar.label}</span>
                <span>{bar.value}</span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--bg-hover)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct(bar.value, total)}%`,
                    height: '100%',
                    background: bar.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <div
    style={{
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: 14,
      background: 'var(--bg-surface)',
    }}
  >
    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</div>
    <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
      {value}
    </div>
  </div>
);
```

- [ ] **Step 2: Import the stats view in `TodoDashboard.tsx`**

```ts
import { TodoStatsView } from './TodoStatsView';
```

- [ ] **Step 3: Add `renderChart`**

Above `renderContent`, add:

```tsx
const renderChart = () => <TodoStatsView todos={todos} />;
```

- [ ] **Step 4: Use the real Chart view**

In `renderContent`, replace:

```tsx
if (view === 'chart') {
  return renderBoard();
}
```

with:

```tsx
if (view === 'chart') {
  return renderChart();
}
```

- [ ] **Step 5: Verify TypeScript**

```powershell
cd D:\PROJECT\to-do-list\client
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```powershell
git add client/src/features/todos/components/TodoDashboard.tsx client/src/features/todos/components/TodoStatsView.tsx
git commit -m "feat: add todo stats view"
```

---

### Task 6: Add Frontend Coverage for Views and Load-More

**Files:**
- Modify: `client/src/__tests__/App.test.tsx`

- [ ] **Step 1: Add a list load-more test**

Inside `describe('Todo dashboard', () => { ... })`, add:

```ts
test('switches to list view and loads more todos', async () => {
  const user = userEvent.setup();
  apiState.nextId = 1;
  apiState.todos = Array.from({ length: 12 }, (_, index) =>
    makeTodo({
      title: `Task ${String(index + 1).padStart(2, '0')}`,
      description: `Generated task ${index + 1}`,
      priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low',
      status: 'pending',
    }),
  );

  render(<App />);

  await user.click(screen.getByRole('tab', { name: /danh sách/i }));

  expect(await screen.findByText('Task 01')).toBeInTheDocument();
  expect(screen.queryByText('Task 11')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /tải thêm/i }));

  expect(await screen.findByText('Task 11')).toBeInTheDocument();
  expect(screen.getByText('Task 12')).toBeInTheDocument();
});
```

- [ ] **Step 2: Add a Tasks view test**

Inside the same describe block, add:

```ts
test('switches to grouped tasks view', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('tab', { name: /công việc/i }));

  expect(await screen.findByRole('region', { name: /công việc theo mức ưu tiên/i })).toBeInTheDocument();
  expect(screen.getByText(/ưu tiên cao/i)).toBeInTheDocument();
  expect(screen.getByText(/ưu tiên thấp/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Add a Chart view test**

Inside the same describe block, add:

```ts
test('switches to chart view', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('tab', { name: /biểu đồ/i }));

  expect(await screen.findByRole('region', { name: /biểu đồ công việc/i })).toBeInTheDocument();
  expect(screen.getByText(/tổng công việc/i)).toBeInTheDocument();
  expect(screen.getByText(/tỷ lệ hoàn thành/i)).toBeInTheDocument();
});
```

- [ ] **Step 4: Run focused frontend tests**

```powershell
cd D:\PROJECT\to-do-list\client
npm test -- src/__tests__/App.test.tsx
```

Expected: all tests in `App.test.tsx` pass.

- [ ] **Step 5: Commit**

```powershell
git add client/src/__tests__/App.test.tsx
git commit -m "test: cover todo dashboard views"
```

---

### Task 7: Final Verification

**Files:**
- No code edits unless a verification command exposes a defect.

- [ ] **Step 1: Run backend typecheck**

```powershell
cd D:\PROJECT\to-do-list\server
npm run typecheck
```

Expected: exit code `0`.

- [ ] **Step 2: Run backend tests**

```powershell
cd D:\PROJECT\to-do-list\server
npm test
```

Expected: all Jest tests pass.

- [ ] **Step 3: Run backend build**

```powershell
cd D:\PROJECT\to-do-list\server
npm run build
```

Expected: exit code `0`.

- [ ] **Step 4: Run frontend typecheck**

```powershell
cd D:\PROJECT\to-do-list\client
npm run typecheck
```

Expected: exit code `0`.

- [ ] **Step 5: Run frontend tests**

```powershell
cd D:\PROJECT\to-do-list\client
npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 6: Run frontend build**

```powershell
cd D:\PROJECT\to-do-list\client
npm run build
```

Expected: Vite production build succeeds.

- [ ] **Step 7: Manual smoke test**

Start both apps:

```powershell
cd D:\PROJECT\to-do-list\server
npm run dev
```

```powershell
cd D:\PROJECT\to-do-list\client
npm run dev
```

Then verify in the browser:

```text
http://localhost:3000
```

Manual checklist:

- Create a todo.
- Edit that todo.
- Toggle it completed and pending.
- Delete it.
- Search by keyword.
- Filter by completed.
- Sort by due date.
- Click `Danh sách` and use `Tải thêm` when more than 10 records exist.
- Click `Công việc` and verify grouped priority sections.
- Click `Biểu đồ` and verify stats update after changes.

- [ ] **Step 8: Commit any verification fixes**

Only if previous steps required additional fixes:

```powershell
git status --short
git add <changed-files>
git commit -m "fix: resolve verification issues"
```

---

## Self-Review

- Spec coverage:
  - CRUD remains handled by existing API, hooks, form, and item/card actions.
  - Search/filter/sort remain handled by `TodoDashboard` filter state and backend query params.
  - Pagination/load-more becomes visible through the List view.
  - View switcher becomes functional.
  - Compass visibility becomes deterministic with `todo-db`.
- Placeholder scan:
  - No placeholder markers or undefined future work remains in this plan.
- Type consistency:
  - `DashboardView` values match `dashboardViews`.
  - New components receive `Todo` and existing callback signatures.
  - Tests use existing `apiState`, `makeTodo`, and mocked API behavior.
