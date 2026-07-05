import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

export const TodoFilters = ({
  order,
  search,
  sortBy,
  status,
  onOrderChange,
  onSearchChange,
  onSortByChange,
  onStatusChange,
}) => (
  <div className="mb-5 grid gap-3 md:grid-cols-[minmax(180px,1fr)_150px_150px_130px]">
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="search">
        Search tasks
      </label>
      <Input
        id="search"
        value={search}
        placeholder="Search title or description"
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="status">
        Status
      </label>
      <Select id="status" value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </Select>
    </div>
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="sortBy">
        Sort by
      </label>
      <Select id="sortBy" value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
        <option value="createdAt">Created</option>
        <option value="dueDate">Due date</option>
        <option value="priority">Priority</option>
        <option value="title">Title</option>
      </Select>
    </div>
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="order">
        Order
      </label>
      <Select id="order" value={order} onChange={(event) => onOrderChange(event.target.value)}>
        <option value="desc">Desc</option>
        <option value="asc">Asc</option>
      </Select>
    </div>
  </div>
);
