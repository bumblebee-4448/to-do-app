import { Filter, Plus, Search } from 'lucide-react';
import type { RefObject } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import type { TodoSortBy, TodoStatus } from '../types';

type DashboardFiltersProps = {
  isOpen: boolean;
  search: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  sortBy: TodoSortBy;
  status: TodoStatus | '';
  onAddTodo: () => void;
  onSearchChange: (search: string) => void;
  onSortByChange: (sortBy: TodoSortBy) => void;
  onStatusChange: (status: TodoStatus | '') => void;
  onToggleFilters: () => void;
};

export const DashboardFilters = ({
  isOpen,
  search,
  searchInputRef,
  sortBy,
  status,
  onAddTodo,
  onSearchChange,
  onSortByChange,
  onStatusChange,
  onToggleFilters,
}: DashboardFiltersProps) => (
  <>
    <div className="dashboard-actions-right">
      <div className="search-input-wrap">
        <label htmlFor="search" className="sr-only">Tìm kiếm công việc</label>
        <Search size={14} className="search-input-wrap__icon" />
        <input
          ref={searchInputRef}
          id="search"
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm..."
          className="input dashboard-search-input"
        />
      </div>

      <button type="button" onClick={onToggleFilters} className="dashboard-filter-toggle">
        <Filter size={13} />
        Bộ lọc
      </button>

      <button type="button" id="add-new-task-btn" onClick={onAddTodo} className="dashboard-primary-action">
        <Plus size={13} strokeWidth={2.5} />
        Thêm việc mới
      </button>
    </div>

    {isOpen && (
      <div className="filter-panel fade-in">
        <div className="field filter-field">
          <label className="field__label filter-field__label" htmlFor="status">Trạng thái</label>
          <Select value={status || 'all'} onValueChange={(val) => onStatusChange(val === 'all' ? '' : (val as TodoStatus))}>
            <SelectTrigger id="status" className="dashboard-select-trigger h-8 text-xs font-medium bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Danh sách công việc</SelectItem>
              <SelectItem value="incomplete">Chưa hoàn thành</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="field filter-field">
          <label className="field__label filter-field__label" htmlFor="sortBy">Sắp xếp theo</label>
          <Select value={sortBy} onValueChange={(val) => onSortByChange(val as TodoSortBy)}>
            <SelectTrigger id="sortBy" className="dashboard-select-trigger h-8 text-xs font-medium bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Ngày tạo</SelectItem>
              <SelectItem value="dueDate">Hạn chót</SelectItem>
              <SelectItem value="title">Tiêu đề</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )}
  </>
);
