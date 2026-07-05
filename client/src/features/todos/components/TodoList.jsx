import { Button } from '../../../components/ui/Button';
import { TodoItem } from './TodoItem';

export const TodoList = ({
  error,
  hasNextPage,
  isError,
  isFetchingNextPage,
  isLoading,
  todos,
  onDelete,
  onEdit,
  onFetchNextPage,
  onToggle,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading tasks">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="h-28 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        {error?.message || 'Tasks could not be loaded.'}
      </div>
    );
  }

  if (!todos.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">No tasks found</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Add a task or adjust the filters to bring work back into view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {todos.map((todo) => (
          <TodoItem
            key={todo._id}
            todo={todo}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggle={onToggle}
          />
        ))}
      </div>
      {hasNextPage ? (
        <div className="pt-2">
          <Button
            variant="secondary"
            className="w-full"
            disabled={isFetchingNextPage}
            onClick={() => onFetchNextPage()}
          >
            {isFetchingNextPage ? 'Loading more' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
