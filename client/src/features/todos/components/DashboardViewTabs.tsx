export type DashboardView = 'board' | 'list';

const dashboardViews: Array<{ value: DashboardView; label: string }> = [
  { value: 'board', label: 'Bảng' },
  { value: 'list', label: 'Danh sách' },
];

type DashboardViewTabsProps = {
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
};

export const DashboardViewTabs = ({ view, onViewChange }: DashboardViewTabsProps) => (
  <div className="view-tabs" role="tablist" aria-label="Chế độ hiển thị">
    {dashboardViews.map((item) => (
      <button
        key={item.value}
        type="button"
        role="tab"
        aria-selected={view === item.value}
        className={`view-tab ${view === item.value ? 'view-tab--active' : ''}`}
        onClick={() => onViewChange(item.value)}
      >
        {item.label}
      </button>
    ))}
  </div>
);
