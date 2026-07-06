import {
  ChevronLeft,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarFeatureId = 'board' | 'list';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateTodo: () => void;
  onFocusSearch: () => void;
  onSelectBoard: () => void;
  onSelectList: () => void;
  activeFeature: SidebarFeatureId;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
};

export const Sidebar = ({
  isOpen,
  onClose,
  onCreateTodo,
  onFocusSearch,
  onSelectBoard,
  onSelectList,
  activeFeature,
  isCollapsed,
  onToggleCollapse,
  className = '',
}: SidebarProps) => {
  const sidebarItems: Array<{
    id: SidebarFeatureId;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  }> = [
    { id: 'board', label: 'Bảng công việc', icon: LayoutDashboard, onClick: onSelectBoard },
    { id: 'list', label: 'Danh sách công việc', icon: ListTodo, onClick: onSelectList },
  ];

  const runSidebarAction = (action: () => void) => {
    action();
    onClose();
  };

  const handleCreateTodo = () => {
    onCreateTodo();
    onClose();
  };

  const handleFocusSearch = () => {
    onFocusSearch();
    onClose();
  };

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
      />
      <aside
        className={`sidebar sidebar--floating sidebar--muted-surface ${className} ${
          isOpen ? 'sidebar--open' : ''
        } ${
          isCollapsed ? 'sidebar--collapsed' : ''
        }`}
      >
        {/* Title row */}
        <div className="sidebar__header">
          <span className="sidebar__title">
            To-do List
          </span>
          
          {/* Collapse sidebar button */}
          <button
            onClick={onToggleCollapse}
            aria-label="Thu gọn sidebar"
            className="sidebar__collapse-btn"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>
          
          {/* Mobile close button */}
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={15} />
          </button>
        </div>

        <div className="sidebar__quick-actions">
          <button
            type="button"
            className="sidebar__create-btn"
            onClick={handleCreateTodo}
          >
            <Plus size={13} strokeWidth={2} />
            <span>Thêm việc mới</span>
          </button>

          <button
            type="button"
            className="sidebar__search-btn"
            aria-label="Tìm kiếm công việc"
            onClick={handleFocusSearch}
          >
            <Search size={14} strokeWidth={2} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Quản lý công việc">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeFeature === item.id;

            return (
              <button
                key={item.label}
                type="button"
                className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => runSidebarAction(item.onClick)}
              >
                <Icon size={14} strokeWidth={2} className="sidebar__item-icon" />
                <span className="sidebar__item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
