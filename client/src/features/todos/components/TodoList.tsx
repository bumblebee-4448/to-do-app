import type { Todo } from '../types';
import { TodoItem } from './TodoItem';
import { Pagination } from './Pagination';
import { QueryStateContainer } from '../../../components/ui/QueryStateContainer';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';

type TodoListProps = {
  error: Error | null;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isError: boolean;
  isLoading: boolean;
  todos: Todo[];
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onPageChange: (page: number) => void;
  onToggle: (todo: Todo) => void;
};

export const TodoList = ({
  error,
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  isError,
  isLoading,
  todos,
  onDelete,
  onEdit,
  onPageChange,
  onToggle,
}: TodoListProps) => {
  return (
    <ErrorBoundary>
      <QueryStateContainer
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={!isLoading && !isError && todos.length === 0}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todos.map((todo) => (
            <ErrorBoundary key={todo._id}>
              <TodoItem
                todo={todo}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggle={onToggle}
              />
            </ErrorBoundary>
          ))}

          <Pagination
            page={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={onPageChange}
          />
        </div>
      </QueryStateContainer>
    </ErrorBoundary>
  );
};
