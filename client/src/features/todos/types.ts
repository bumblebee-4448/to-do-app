export type TodoStatus = 'pending' | 'incomplete' | 'completed';
export type TodoSortBy = 'createdAt' | 'dueDate' | 'title' | 'position';
export type TodoOrder = 'asc' | 'desc';

export interface Todo {
  _id: string;
  title: string;
  description: string;
  status: TodoStatus;
  dueDate?: string | null;
  position?: number;
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
  dueDate?: string | null;
  status?: TodoStatus;
};

export type TodoUpdatePayload = TodoCreatePayload & {
  status?: TodoStatus;
};

export type TodoPatchPayload = Partial<TodoUpdatePayload>;

export type TodoMovePayload = {
  status: TodoStatus;
  beforeId?: string | null;
  afterId?: string | null;
};
