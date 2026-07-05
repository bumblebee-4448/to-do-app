export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'pending' | 'completed';
export type TodoSortBy = 'createdAt' | 'dueDate' | 'priority' | 'title';
export type TodoOrder = 'asc' | 'desc';

export interface Todo {
  _id: string;
  title: string;
  description: string;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface TodoListResponse extends ApiSuccess<Todo[]> {
  pagination: PaginationMeta;
}

export interface TodoFilters {
  search: string;
  status: TodoStatus | '';
  sortBy: TodoSortBy;
  order: TodoOrder;
  limit: number;
}

export type TodoCreatePayload = {
  title: string;
  description: string;
  priority: TodoPriority;
  dueDate?: string;
};

export type TodoUpdatePayload = TodoCreatePayload & {
  status?: TodoStatus;
};

export type TodoPatchPayload = Partial<TodoUpdatePayload>;
