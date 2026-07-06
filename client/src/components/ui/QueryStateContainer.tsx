import type { ReactNode } from 'react';

type QueryStateContainerProps = {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty: boolean;
  emptyFallback?: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode | ((error: Error | null) => ReactNode);
  children: ReactNode;
};

export const QueryStateContainer = ({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyFallback,
  loadingFallback,
  errorFallback,
  children,
}: QueryStateContainerProps) => {
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Loading tasks">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="skeleton"
            style={{ height: 72, borderRadius: 10 }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    if (errorFallback) {
      if (typeof errorFallback === 'function') {
        return <>{errorFallback(error)}</>;
      }
      return <>{errorFallback}</>;
    }

    return (
      <div className="alert alert--danger" role="alert">
        {error?.message || 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.'}
      </div>
    );
  }

  if (isEmpty) {
    if (emptyFallback) return <>{emptyFallback}</>;

    return (
      <div
        className="kanban-col__empty"
        style={{ padding: '48px 24px', fontSize: 13, textAlign: 'center' }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Không tìm thấy công việc nào
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
          Thêm công việc mới hoặc điều chỉnh bộ lọc để hiển thị công việc.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
