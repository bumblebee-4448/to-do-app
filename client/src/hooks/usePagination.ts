import { useState, useCallback } from 'react';

export interface UsePaginationProps {
  initialPage?: number;
  totalPages?: number;
}

export const usePagination = ({ initialPage = 1, totalPages = 1 }: UsePaginationProps = {}) => {
  const [page, setPage] = useState(initialPage);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  const nextPage = useCallback((hasNext: boolean) => {
    if (hasNext) {
      setPage((current) => current + 1);
    }
  }, []);

  const prevPage = useCallback((hasPrev: boolean) => {
    if (hasPrev) {
      setPage((current) => Math.max(1, current - 1));
    }
  }, []);

  const goToPage = useCallback((targetPage: number, maxPages = totalPages) => {
    const safePage = Math.min(Math.max(1, targetPage), maxPages);
    setPage(safePage);
  }, [totalPages]);

  return {
    page,
    setPage,
    reset,
    nextPage,
    prevPage,
    goToPage,
  };
};
