type PaginationProps = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
};

const getVisiblePages = (page: number, totalPages: number) => {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const Pagination = ({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Phân trang"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 16,
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 16,
      }}
    >
      <button
        className="btn btn--secondary"
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
        style={{ padding: '0 8px', height: 32, minWidth: 32, justifyContent: 'center' }}
        aria-label="Trang trước"
      >
        Trước
      </button>

      {getVisiblePages(page, totalPages).map((pageNum) => {
        const isActive = pageNum === page;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              height: 32,
              minWidth: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              borderRadius: 6,
              border: isActive ? 'none' : '1px solid var(--border-default)',
              background: isActive ? 'var(--text-primary)' : 'transparent',
              color: isActive ? 'var(--bg-surface)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
            }}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        className="btn btn--secondary"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        style={{ padding: '0 8px', height: 32, minWidth: 32, justifyContent: 'center' }}
        aria-label="Trang sau"
      >
        Sau
      </button>
    </nav>
  );
};
