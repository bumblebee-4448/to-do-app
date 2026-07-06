import { Calendar, Pencil, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';
import { formatDueDate, isOverdue } from '../../../utils/date';
import type { Todo } from '../types';
import { Badge } from '../../../components/ui/Badge';

type KanbanCardProps = {
  todo: Todo;
  index?: number;
  'data-card-index'?: number;
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onToggle: (todo: Todo) => void;
};

/* ── Progress ring: SVG circular indicator ────────────────── */


const progressColor = (pct: number) => {
  if (pct >= 100) return '#22c55e';
  if (pct >= 75)  return '#f59e0b';
  if (pct >= 50)  return '#3b82f6';
  if (pct >= 25)  return '#f97316';
  return '#d1d5db';
};

const ProgressRing = ({ percent }: { percent: number }) => {
  const r = 9;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  const color = progressColor(percent);

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      style={{ flexShrink: 0 }}
      aria-label={`${percent}% complete`}
    >
      {/* track */}
      <circle cx="11" cy="11" r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
      {/* fill */}
      {percent > 0 && (
        <circle
          cx="11"
          cy="11"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      )}
    </svg>
  );
};



/* ── Main card ─────────────────────────────────────────────── */
export const KanbanCard = ({
  todo,
  index = 0,
  'data-card-index': cardIndex,
  onDelete,
  onEdit,
  onToggle,
}: KanbanCardProps) => {
  const completed = todo.status === 'completed';
  const overdue   = isOverdue(todo.dueDate, todo.status);

  const pct = completed ? 100 : 0;

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', todo._id);
    event.currentTarget.classList.add('kanban-card--dragging');
  };

  const handleDragEnd = (event: DragEvent<HTMLElement>) => {
    event.currentTarget.classList.remove('kanban-card--dragging');
  };

  return (
    <article
      className="kanban-card card-enter"
      data-testid={`todo-item-${todo.title}`}
      data-card-index={cardIndex ?? index}
      draggable
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(todo)}
    >
      {/* Action buttons (revealed on hover via CSS) */}
      <div className="kanban-card__actions" onClick={(e) => e.stopPropagation()}>
        <ActionBtn
          label={`Chỉnh sửa "${todo.title}"`}
          onClick={() => onEdit(todo)}
        >
          <Pencil size={12} />
        </ActionBtn>
        <ActionBtn
          label={`Xóa "${todo.title}"`}
          onClick={() => onDelete(todo)}
          danger
        >
          <Trash2 size={12} />
        </ActionBtn>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <Badge tone={todo.status}>{todo.status}</Badge>
        {overdue && <Badge tone="overdue">Quá hạn</Badge>}
      </div>

      {/* Title */}
      <h3 className={`kanban-card__title ${completed ? 'kanban-card__title--done' : ''}`}>
        {todo.title}
      </h3>

      {/* Description */}
      {todo.description ? (
        <p className="kanban-card__desc line-clamp-2">
          {todo.description}
        </p>
      ) : (
        <div style={{ marginBottom: 10 }} />
      )}

      {/* Meta row: date · progress ring + pct */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            color: overdue ? 'var(--color-danger)' : 'var(--text-tertiary)',
          }}
        >
          <Calendar size={13} />
          {formatDueDate(todo.dueDate)}
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            color: progressColor(pct),
          }}
        >
          <ProgressRing percent={pct} />
          {pct}%
        </span>
      </div>

      {/* Footer: toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Completion toggle */}
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
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            if (!completed) {
              el.style.borderColor = '#22c55e';
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            if (!completed) {
              el.style.borderColor = 'var(--border-default)';
            }
          }}
        >
          {completed && (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </article>
  );
};

/* ── Small action button ─────────────────────────────────── */
type ActionBtnProps = {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const ActionBtn = ({ label, danger, onClick, children }: ActionBtnProps) => (
  <button
    aria-label={label}
    onClick={onClick}
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      cursor: 'pointer',
      color: danger ? 'var(--color-danger)' : 'var(--text-secondary)',
      padding: '4px',
      borderRadius: 5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 150ms, color 150ms',
      boxShadow: 'var(--shadow-xs)',
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLButtonElement;
      el.style.background = danger ? 'var(--color-danger-bg)' : 'var(--bg-hover)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
    }}
  >
    {children}
  </button>
);
