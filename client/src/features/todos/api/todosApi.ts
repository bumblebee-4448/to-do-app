import { api } from '../../../lib/axios';
import type {
  ApiSuccess,
  Todo,
  TodoCreatePayload,
  TodoFilters,
  TodoListResponse,
  TodoMovePayload,
  TodoPatchPayload,
  TodoUpdatePayload,
} from '../types';

type RequestPayload = Record<string, string | undefined | null>;

const cleanPayload = <T extends RequestPayload>(payload: T) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

export const todosApi = {
  getTodos: (params: TodoFilters & { page?: number }) =>
    api.get<TodoListResponse, TodoListResponse>('/todos', { params }),
  getTodo: (id: string) => api.get<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}`),
  createTodo: (payload: TodoCreatePayload) =>
    api.post<ApiSuccess<Todo>, ApiSuccess<Todo>>('/todos', cleanPayload(payload)),
  updateTodo: (id: string, payload: TodoUpdatePayload) =>
    api.patch<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}`, cleanPayload(payload)),
  patchTodo: (id: string, payload: TodoPatchPayload) =>
    api.patch<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}`, cleanPayload(payload)),
  moveTodo: (id: string, payload: TodoMovePayload) =>
    api.patch<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}/move`, cleanPayload(payload)),
  deleteTodo: (id: string) => api.delete<void, void>(`/todos/${id}`),
};
