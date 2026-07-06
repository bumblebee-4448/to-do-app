import { useMemo } from 'react';
import { useTodos } from './useTodos';
import { usePagination } from '../../../hooks/usePagination';
import type { TodoFilters, TodoStatus } from '../types';

const boardStatuses: TodoStatus[] = ['pending', 'incomplete', 'completed'];

export const useBoardTodos = (baseFilters: Omit<TodoFilters, 'status' | 'limit'>) => {
  const pendingPagination = usePagination({ initialPage: 1 });
  const incompletePagination = usePagination({ initialPage: 1 });
  const completedPagination = usePagination({ initialPage: 1 });

  const queries = {
    pending: useTodos({ ...baseFilters, status: 'pending', limit: 10, page: pendingPagination.page }),
    incomplete: useTodos({ ...baseFilters, status: 'incomplete', limit: 10, page: incompletePagination.page }),
    completed: useTodos({ ...baseFilters, status: 'completed', limit: 10, page: completedPagination.page }),
  };

  const columns = useMemo(
    () => ({
      list: queries.pending.data?.data ?? [],
      incomplete: queries.incomplete.data?.data ?? [],
      done: queries.completed.data?.data ?? [],
    }),
    [queries.pending.data, queries.incomplete.data, queries.completed.data],
  );

  const pages = {
    pending: pendingPagination.page,
    incomplete: incompletePagination.page,
    completed: completedPagination.page,
  };

  const setColumnPage = (status: TodoStatus, page: number) => {
    if (status === 'pending') {
      pendingPagination.setPage(page);
    } else if (status === 'incomplete') {
      incompletePagination.setPage(page);
    } else if (status === 'completed') {
      completedPagination.setPage(page);
    }
  };

  return { boardStatuses, columns, queries, pages, setColumnPage };
};
