import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { cn } from '../../../utils/cn';
import { formatDueDate, isOverdue } from '../../../utils/date';

export const TodoItem = ({ todo, onDelete, onEdit, onToggle }) => {
  const completed = todo.status === 'completed';
  const overdue = isOverdue(todo.dueDate, todo.status);

  return (
    <article
      className={cn(
        'task-enter rounded-lg border border-zinc-200 bg-white p-4 transition duration-300 ease-editorial dark:border-zinc-700 dark:bg-zinc-900',
        completed && 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400',
      )}
      data-testid={`todo-item-${todo.title}`}
    >
      <div className="flex gap-3">
        <Checkbox
          checked={completed}
          aria-label={completed ? `Mark ${todo.title} pending` : `Mark ${todo.title} complete`}
          onChange={() => onToggle(todo)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                'break-words text-base font-semibold text-zinc-950 dark:text-zinc-50',
                completed && 'text-zinc-500 line-through dark:text-zinc-400',
              )}
            >
              {todo.title}
            </h3>
            <Badge tone={todo.priority}>{todo.priority}</Badge>
            <Badge tone={todo.status}>{todo.status}</Badge>
            {overdue ? <Badge tone="overdue">Overdue</Badge> : null}
          </div>

          {todo.description ? (
            <p className={cn('mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300', completed && 'opacity-60')}>
              {todo.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} aria-hidden="true" />
              {formatDueDate(todo.dueDate)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            className="h-9 w-9 px-0"
            aria-label={`Edit ${todo.title}`}
            title={`Edit ${todo.title}`}
            onClick={() => onEdit(todo)}
          >
            <Pencil size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="danger"
            className="h-9 w-9 px-0"
            aria-label={`Delete ${todo.title}`}
            title={`Delete ${todo.title}`}
            onClick={() => onDelete(todo)}
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
};
