import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { formatDueDate, isOverdue } from '../../../utils/date';
import type { Todo } from '../types';
import { Badge } from '../../../components/ui/Badge';

type TodoItemProps = {
  todo: Todo;
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onToggle: (todo: Todo) => void;
};



export const TodoItem = ({ todo, onDelete, onEdit, onToggle }: TodoItemProps) => {
  const completed = todo.status === 'completed';
  const overdue = isOverdue(todo.dueDate, todo.status);

  return (
    <article
      className="kanban-card slide-up"
      data-testid={`todo-item-${todo.title}`}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '14px 16px',
        cursor: 'default',
      }}
    >
      {/* Toggle checkbox */}
      <button
        aria-label={completed ? `Đánh dấu "${todo.title}" là chưa hoàn thành` : `Đánh dấu "${todo.title}" là hoàn thành`}
        title={completed ? 'Mở lại công việc' : 'Đánh dấu hoàn thành'}
        onClick={() => onToggle(todo)}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: completed ? '2px solid #22c55e' : '2px solid var(--border-default)',
          background: completed ? '#22c55e' : 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 200ms, background 200ms',
          padding: 0,
          marginTop: 2,
        }}
        onMouseEnter={(e) => {
          if (!completed) (e.currentTarget as HTMLButtonElement).style.borderColor = '#22c55e';
        }}
        onMouseLeave={(e) => {
          if (!completed) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
        }}
      >
        {completed && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3
            className={`kanban-card__title ${completed ? 'kanban-card__title--done' : ''}`}
            style={{ margin: 0, padding: 0, fontSize: 14 }}
          >
            {todo.title}
          </h3>
          <Badge tone={todo.status}>{todo.status}</Badge>
          {overdue && (
            <Badge tone="overdue">Quá hạn</Badge>
          )}
        </div>

        {todo.description && (
          <p className="kanban-card__desc" style={{ margin: '4px 0 8px', opacity: completed ? 0.6 : 1 }}>
            {todo.description}
          </p>
        )}

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            color: overdue ? 'var(--color-danger)' : 'var(--text-tertiary)',
          }}
        >
          <Calendar size={13} />
          {formatDueDate(todo.dueDate)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          className="icon-btn"
          aria-label={`Chỉnh sửa ${todo.title}`}
          title={`Chỉnh sửa ${todo.title}`}
          onClick={() => onEdit(todo)}
        >
          <Pencil size={15} />
        </button>
        <button
          className="icon-btn icon-btn--danger"
          aria-label={`Xóa ${todo.title}`}
          title={`Xóa ${todo.title}`}
          onClick={() => onDelete(todo)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
};
