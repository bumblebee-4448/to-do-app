import { List, Moon, Sun } from 'lucide-react';

type DashboardTopbarProps = {
  isSidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
};

export const DashboardTopbar = ({
  isSidebarCollapsed,
  theme,
  onOpenSidebar,
  onToggleTheme,
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

    <button className="icon-btn dashboard-theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  </header>
);
