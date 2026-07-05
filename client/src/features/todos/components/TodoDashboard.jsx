import { useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useDebounce } from '../../../hooks/useDebounce';
import { useThemeStore } from '../../../stores/themeStore';
import {
  useCreateTodo,
  useDeleteTodo,
  usePatchTodo,
  useTodos,
  useUpdateTodo,
} from '../hooks/useTodos';
import { toTodoPayload } from '../schemas/todoSchema';
import { TodoFilters } from './TodoFilters';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';

export const TodoDashboard = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [editingTodo, setEditingTodo] = useState(null);
  const [mutationMessage, setMutationMessage] = useState('');
  const debouncedSearch = useDebounce(search);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status,
      sortBy,
      order,
      limit: 8,
    }),
    [debouncedSearch, status, sortBy, order],
  );

  const todosQuery = useTodos(filters);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const patchTodo = usePatchTodo();
  const deleteTodo = useDeleteTodo();

  const todos = todosQuery.data?.pages.flatMap((page) => page.data) || [];
  const total = todosQuery.data?.pages[0]?.pagination?.total || 0;
  const completed = todos.filter((todo) => todo.status === 'completed').length;
  const open = Math.max(todos.length - completed, 0);
  const isSaving = createTodo.isPending || updateTodo.isPending;

  const handleMutationError = (error) => {
    setMutationMessage(error.message || 'The change could not be saved.');
  };

  const handleSubmit = (values) => {
    setMutationMessage('');
    const payload = toTodoPayload(values);

    if (editingTodo) {
      updateTodo.mutate(
        { id: editingTodo._id, payload: { ...payload, status: editingTodo.status } },
        {
          onSuccess: () => setEditingTodo(null),
          onError: handleMutationError,
        },
      );
      return;
    }

    createTodo.mutate(payload, {
      onSuccess: () => setMutationMessage('Task added.'),
      onError: handleMutationError,
    });
  };

  const handleToggle = (todo) => {
    setMutationMessage('');
    patchTodo.mutate(
      {
        id: todo._id,
        payload: {
          status: todo.status === 'completed' ? 'pending' : 'completed',
        },
      },
      { onError: handleMutationError },
    );
  };

  const handleDelete = (todo) => {
    setMutationMessage('');
    deleteTodo.mutate(todo._id, {
      onError: handleMutationError,
    });
  };

  return (
    <main className="min-h-[100dvh] bg-[#F7F6F3] text-zinc-950 transition-colors duration-200 dark:bg-zinc-900 dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-700 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Todo List
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50 md:text-5xl">
              Today's Work
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid grid-cols-3 divide-x divide-zinc-200 rounded-lg border border-zinc-200 bg-white text-center dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-800">
              <Stat label="Total" value={total} />
              <Stat label="Open" value={open} />
              <Stat label="Done" value={completed} />
            </div>
            <Button
              variant="secondary"
              className="h-11 w-11 px-0"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="space-y-4">
            <TodoForm
              editingTodo={editingTodo}
              isSaving={isSaving}
              onCancelEdit={() => setEditingTodo(null)}
              onSubmit={handleSubmit}
            />
            {mutationMessage ? (
              <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {mutationMessage}
              </p>
            ) : null}
          </div>

          <Card className="p-4 sm:p-5">
            <TodoFilters
              order={order}
              search={search}
              sortBy={sortBy}
              status={status}
              onOrderChange={setOrder}
              onSearchChange={setSearch}
              onSortByChange={setSortBy}
              onStatusChange={setStatus}
            />
            <TodoList
              error={todosQuery.error}
              hasNextPage={todosQuery.hasNextPage}
              isError={todosQuery.isError}
              isFetchingNextPage={todosQuery.isFetchingNextPage}
              isLoading={todosQuery.isLoading}
              todos={todos}
              onDelete={handleDelete}
              onEdit={setEditingTodo}
              onFetchNextPage={todosQuery.fetchNextPage}
              onToggle={handleToggle}
            />
          </Card>
        </section>
      </div>
    </main>
  );
};

const Stat = ({ label, value }) => (
  <div className="min-w-20 px-3 py-2">
    <p className="font-mono text-lg font-semibold leading-none">{value}</p>
    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
  </div>
);
