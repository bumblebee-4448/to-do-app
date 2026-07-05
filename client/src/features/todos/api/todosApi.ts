import { api } from '../../../config/api';
import type {
  ApiSuccess,
  Todo,
  TodoCreatePayload,
  TodoFilters,
  TodoListResponse,
  TodoPatchPayload,
  TodoUpdatePayload,
} from '../types';

type RequestPayload = Record<string, string | undefined | null>;

const cleanPayload = <T extends RequestPayload>(payload: T) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>;

export const todosApi = {
  getTodos: (params: TodoFilters & { page?: number }) =>
    api.get<TodoListResponse, TodoListResponse>('/todos', { params }),
  getTodo: (id: string) => api.get<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}`),
  createTodo: (payload: TodoCreatePayload) =>
    api.post<ApiSuccess<Todo>, ApiSuccess<Todo>>('/todos', cleanPayload(payload)),
  updateTodo: (id: string, payload: TodoUpdatePayload) =>
    api.put<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}`, cleanPayload(payload)),
  patchTodo: (id: string, payload: TodoPatchPayload) =>
    api.patch<ApiSuccess<Todo>, ApiSuccess<Todo>>(`/todos/${id}`, cleanPayload(payload)),
  deleteTodo: (id: string) => api.delete<void, void>(`/todos/${id}`),
};
