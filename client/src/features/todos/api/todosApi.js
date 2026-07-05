import { api } from '../../../config/api';

const cleanPayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

export const todosApi = {
  getTodos: (params) => api.get('/todos', { params }),
  getTodo: (id) => api.get(`/todos/${id}`),
  createTodo: (payload) => api.post('/todos', cleanPayload(payload)),
  updateTodo: (id, payload) => api.put(`/todos/${id}`, cleanPayload(payload)),
  patchTodo: (id, payload) => api.patch(`/todos/${id}`, cleanPayload(payload)),
  deleteTodo: (id) => api.delete(`/todos/${id}`),
};
