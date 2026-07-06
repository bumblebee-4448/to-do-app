import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import type { Todo } from '../types';
import { KanbanCard } from './KanbanCard';
import { QueryStateContainer } from '../../../components/ui/QueryStateContainer';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';

export type KanbanColumnId = 'list' | 'incomplete' | 'done';

type KanbanColumnProps = {
  column: KanbanColumnId;
  id: string;
  title: string;
  icon: ReactNode;
  todos: Todo[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  /** Staggered entrance animation class e.g. "col-enter-1" */
  enterClass?: string;
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onToggle: (todo: Todo) => void;
  onDropTodo: (todoId: string, column: KanbanColumnId, beforeId: string | null, afterId: string | null) => void;
  onAddTask?: () => void;
  pagination?: {
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onPageChange: (page: number) => void;
  };
};

export const KanbanColumn = ({
  column,
  id,
  title,
  icon,
  todos,
  isLoading = false,
  isError = false,
  error = null,
  enterClass = '',
  onDelete,
  onEdit,
  onToggle,
  onDropTodo,
  onAddTask,
  pagination,
}: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropIndex, setDropIndex] = useState<number>(todos.length);
  const bodyRef = useRef<HTMLDivElement>(null);

  /** Given a Y coordinate inside the column body, compute which card index to insert before */
  const computeDropIndex = (clientY: number): number => {
    if (!bodyRef.current) return todos.length;
    const cardEls = bodyRef.current.querySelectorAll<HTMLElement>('[data-card-index]');
    for (const el of Array.from(cardEls)) {
      const rect = el.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) {
        return Number(el.dataset.cardIndex ?? todos.length);
      }
    }
    return todos.length;
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    setDropIndex(computeDropIndex(event.clientY));
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragOver(false);
      setDropIndex(todos.length);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const idx = computeDropIndex(event.clientY);
    setIsDragOver(false);
    setDropIndex(todos.length);

    const todoId = event.dataTransfer.getData('text/plain');
    if (todoId) {
      const beforeId = todos[idx]?._id ?? null;
      const afterId = idx > 0 ? todos[idx - 1]?._id ?? null : null;
      onDropTodo(todoId, column, beforeId, afterId);
    }
  };

  const renderCards = () => {
    // flatMap gives us a flat array without wrapper divs
    const items: React.ReactNode[] = todos.flatMap((todo, i) => {
      const result: React.ReactNode[] = [];
      if (isDragOver && dropIndex === i) {
        result.push(<div key={`ind-${i}`} className="kanban-drop-indicator" />);
      }
      result.push(
        <ErrorBoundary key={todo._id}>
          <KanbanCard
            todo={todo}
            index={i}
            data-card-index={i}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggle={onToggle}
          />
        </ErrorBoundary>
      );
      return result;
    });

    // Indicator at the very bottom
    if (isDragOver && dropIndex === todos.length) {
      items.push(<div key="ind-end" className="kanban-drop-indicator" />);
    }

    return <>{items}</>;
  };

  const loadingFallback = (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 130, borderRadius: 12 }}
        />
      ))}
    </>
  );

  const emptyFallback = (
    <>
      {isDragOver && <div className="kanban-drop-indicator" />}
      <div className="kanban-col__empty" onClick={onAddTask}>
        + Thêm thẻ mới
      </div>
    </>
  );

  return (
    <ErrorBoundary>
      <div
        className={`kanban-col ${isDragOver ? 'kanban-col--drag-over' : ''} ${enterClass}`}
        id={id}
        role="region"
        aria-label={title}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Column header */}
        <div className="kanban-col__header">
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>

          <span className="kanban-col__title">
            {title}
          </span>

          <span className="kanban-col__count">
            {todos.length}
          </span>

          {onAddTask && (
            <button
              onClick={onAddTask}
              aria-label={`Thêm công việc vào ${title}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms, border-color 150ms',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'var(--bg-hover)';
                el.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'transparent';
                el.style.borderColor = 'var(--border-default)';
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Cards area */}
        <div className="kanban-col__body" ref={bodyRef}>
          <QueryStateContainer
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={!isLoading && !isError && todos.length === 0}
            loadingFallback={loadingFallback}
            emptyFallback={emptyFallback}
          >
            {renderCards()}
          </QueryStateContainer>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              paddingTop: 10,
              marginTop: 8,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              className="btn btn--secondary"
              disabled={!pagination.hasPrevPage}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              aria-label="Trang trước"
              style={{ height: 28, padding: '0 8px', fontSize: 11 }}
            >
              Trước
            </button>
            <span
              style={{
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
            >
              {pagination.page}/{pagination.totalPages}
            </span>
            <button
              className="btn btn--secondary"
              disabled={!pagination.hasNextPage}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              aria-label="Trang sau"
              style={{ height: 28, padding: '0 8px', fontSize: 11 }}
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
