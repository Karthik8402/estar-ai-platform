interface PaginationBarProps {
  start: number;
  end: number;
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export default function PaginationBar({
  start,
  end,
  total,
  page,
  totalPages,
  onPrev,
  onNext,
  className,
}: PaginationBarProps) {
  const classes = className ? `pagination-bar ${className}` : 'pagination-bar';

  return (
    <div className={classes}>
      <span className="pagination-meta">Showing {start}-{end} of {total}</span>
      <span className="pagination-meta">Page {page} of {totalPages}</span>
      <div className="pagination-controls">
        <button className="pagination-btn" disabled={page <= 1} onClick={onPrev}>
          Prev
        </button>
        <button className="pagination-btn" disabled={page >= totalPages} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
