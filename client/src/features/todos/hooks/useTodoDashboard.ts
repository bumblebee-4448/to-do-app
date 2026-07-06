import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { useThemeStore } from '../../../stores/themeStore';
import {
  useCreateTodo,
  useDeleteTodo,
  useMoveTodo,
  usePatchTodo,
  useTodos,
  useUpdateTodo,
} from './useTodos';
import { useBoardTodos } from './useBoardTodos';
import { toTodoPayload, type TodoFormValues } from '../schemas/todoSchema';
import type {
  Todo,
  TodoFilters,
  TodoOrder,
  TodoSortBy,
  TodoStatus,
} from '../types';
import type { KanbanColumnId } from '../components/KanbanColumn';
import type { DashboardView } from '../components/DashboardViewTabs';

export const useTodoDashboard = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TodoStatus | ''>('');
  const [sortBy, setSortBy] = useState<TodoSortBy>('createdAt');
  const [order, setOrder] = useState<TodoOrder>('desc');
  const [view, setView] = useState<DashboardView>('board');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<KanbanColumnId>('list');

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const debouncedSearch = useDebounce(search);
  const listPagination = usePagination({ initialPage: 1 });

  const filters = useMemo<TodoFilters & { page: number }>(
    () => ({
      search: debouncedSearch,
      status,
      sortBy,
      order,
      limit: 10,
      page: listPagination.page,
    }),
    [debouncedSearch, status, sortBy, order, listPagination.page]
  );

  const boardFilters = useMemo(
    () => ({
      search: debouncedSearch,
      sortBy: 'position' as const,
      order: 'asc' as const,
    }),
    [debouncedSearch]
  );

  const todosQuery = useTodos(filters);
  const board = useBoardTodos(boardFilters);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const patchTodo = usePatchTodo();
  const moveTodo = useMoveTodo();
  const deleteTodo = useDeleteTodo();

  const todos = todosQuery.data?.data ?? [];
  const totalPages = todosQuery.data?.pagination?.totalPages ?? 1;

  useEffect(() => {
    const apiTotalPages = todosQuery.data?.pagination?.totalPages;
    if (view === 'list' && apiTotalPages && listPagination.page > apiTotalPages) {
      listPagination.setPage(apiTotalPages);
    }
  }, [listPagination.page, todosQuery.data?.pagination?.totalPages, view, listPagination]);

  const handleSubmit = (values: TodoFormValues) => {
    const payload = toTodoPayload(values);

    if (editingTodo) {
      updateTodo.mutate(
        { id: editingTodo._id, payload: { ...payload, status: editingTodo.status } },
        {
          onSuccess: () => {
            toast.success('Đã lưu thay đổi công việc!');
            setEditingTodo(null);
            setIsFormOpen(false);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
      return;
    }

    const createPayload = {
      ...payload,
      status: defaultColumn === 'incomplete'
        ? ('incomplete' as const)
        : defaultColumn === 'done'
          ? ('completed' as const)
          : ('pending' as const),
      dueDate: defaultColumn === 'incomplete' && !payload.dueDate
        ? new Date().toISOString()
        : payload.dueDate,
    };

    createTodo.mutate(createPayload, {
      onSuccess: () => {
        toast.success('Đã thêm công việc thành công!');
        setIsFormOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleToggle = (todo: Todo) => {
    const nextStatus = todo.status === 'completed' ? (todo.dueDate ? 'incomplete' : 'pending') : 'completed';
    patchTodo.mutate(
      { id: todo._id, payload: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(
            nextStatus === 'completed' ? 'Đã hoàn thành công việc!' : 'Đã mở lại công việc!'
          );
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleDropTodo = (
    todoId: string,
    column: KanbanColumnId,
    beforeId: string | null,
    afterId: string | null
  ) => {
    const statusByColumn: Record<KanbanColumnId, TodoStatus> = {
      list: 'pending',
      incomplete: 'incomplete',
      done: 'completed',
    };

    moveTodo.mutate(
      {
        id: todoId,
        payload: {
          status: statusByColumn[column],
          beforeId,
          afterId,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã di chuyển công việc!');
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleDelete = (todo: Todo) => {
    setTodoToDelete(todo);
  };

  const handleConfirmDelete = () => {
    if (!todoToDelete) return;
    deleteTodo.mutate(todoToDelete._id, {
      onSuccess: () => {
        toast.success('Đã xóa công việc thành công!');
        setTodoToDelete(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setTodoToDelete(null);
      },
    });
  };

  const handleOpenEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  const handleOpenCreate = (col: KanbanColumnId) => {
    setEditingTodo(null);
    setDefaultColumn(col);
    setIsFormOpen(true);
  };

  const showAllTasksInView = (nextView: DashboardView) => {
    setStatus('');
    setView(nextView);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
    setIsSidebarCollapsed(false);
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    listPagination.reset();
  };

  const handleStatusChange = (nextStatus: TodoStatus | '') => {
    setStatus(nextStatus);
    listPagination.reset();
  };

  const handleSortByChange = (nextSortBy: TodoSortBy) => {
    setSortBy(nextSortBy);
    listPagination.reset();
  };

  return {
    search,
    status,
    sortBy,
    order,
    view,
    isFormOpen,
    isFilterOpen,
    isSidebarOpen,
    isSidebarCollapsed,
    editingTodo,
    todoToDelete,
    defaultColumn,
    theme,
    toggleTheme,
    page: listPagination.page,
    setPage: listPagination.setPage,
    listPagination,
    filters,
    boardFilters,
    todosQuery,
    board,
    createTodo,
    updateTodo,
    patchTodo,
    moveTodo,
    deleteTodo,
    todos,
    totalPages,
    handleSubmit,
    handleToggle,
    handleDropTodo,
    handleDelete,
    handleConfirmDelete,
    handleOpenEdit,
    handleOpenCreate,
    showAllTasksInView,
    handleOpenSidebar,
    handleSearchChange,
    handleStatusChange,
    handleSortByChange,
    setOrder,
    setView,
    setIsFormOpen,
    setIsFilterOpen,
    setIsSidebarOpen,
    setIsSidebarCollapsed,
    setTodoToDelete,
  };
};
