import { List } from 'lucide-react';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

type DashboardTopbarProps = {
  isSidebarCollapsed: boolean;
  onOpenSidebar: () => void;
};

export const DashboardTopbar = ({
  isSidebarCollapsed,
  onOpenSidebar,
}: DashboardTopbarProps) => (
  <header className="topbar topbar--dashboard heading-enter">
    <button
      className={`sidebar-toggle-btn ${isSidebarCollapsed ? 'sidebar-toggle-btn--collapsed' : ''}`}
      onClick={onOpenSidebar}
      aria-label="Open sidebar"
    >
      <List size={18} strokeWidth={2.5} />
    </button>

    <h1 className="topbar__title">Danh sách việc cần làm</h1>
    <div className="topbar__spacer" />

    <ThemeToggle />
  </header>
);
