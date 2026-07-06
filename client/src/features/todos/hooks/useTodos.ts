import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryKey,
} from '@tanstack/react-query';
import { todosApi } from '../api/todosApi';
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

const todosRootKey = ['todos'] as const;

export const useTodos = (filters: TodoFilters & { page: number }) =>
  useQuery<TodoListResponse, Error>({
    queryKey: ['todos', filters],
    queryFn: () => todosApi.getTodos(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSuccess<Todo>, Error, TodoCreatePayload>({
    mutationFn: (payload) => todosApi.createTodo(payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSuccess<Todo>,
    Error,
    { id: string; payload: TodoUpdatePayload }
  >({
    mutationFn: ({ id, payload }) => todosApi.updateTodo(id, payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const usePatchTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSuccess<Todo>,
    Error,
    { id: string; payload: TodoPatchPayload },
    { previousTodosQueries: [QueryKey, TodoListResponse | undefined][] }
  >({
    mutationFn: ({ id, payload }) => todosApi.patchTodo(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: todosRootKey });

      const previousTodosQueries = queryClient.getQueriesData<TodoListResponse>({
        queryKey: todosRootKey,
      });

      queryClient.setQueriesData<TodoListResponse>(
        { queryKey: todosRootKey },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((todo) =>
              todo._id === id ? { ...todo, ...payload } : todo
            ),
          };
        }
      );

      return { previousTodosQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTodosQueries) {
        context.previousTodosQueries.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosRootKey });
    },
  });
};

export const useMoveTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSuccess<Todo>,
    Error,
    { id: string; payload: TodoMovePayload },
    { previousTodosQueries: [QueryKey, TodoListResponse | undefined][] }
  >({
    mutationFn: ({ id, payload }) => todosApi.moveTodo(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: todosRootKey });

      const previousTodosQueries = queryClient.getQueriesData<TodoListResponse>({
        queryKey: todosRootKey,
      });

      let todoToMove: Todo | undefined;
      for (const [, response] of previousTodosQueries) {
        const found = response?.data?.find((t) => t._id === id);
        if (found) {
          todoToMove = found;
          break;
        }
      }

      if (todoToMove) {
        const oldStatus = todoToMove.status;
        const newStatus = payload.status;

        const queries = queryClient.getQueryCache().findAll({ queryKey: todosRootKey });

        for (const query of queries) {
          const queryFilters = query.queryKey[1] as TodoFilters & { page?: number } | undefined;
          const queryStatus = queryFilters?.status;

          queryClient.setQueryData<TodoListResponse>(
            query.queryKey,
            (oldQueryData) => {
              if (!oldQueryData) return oldQueryData;

              if (queryStatus === oldStatus) {
                return {
                  ...oldQueryData,
                  data: oldQueryData.data.filter((t) => t._id !== id),
                  pagination: {
                    ...oldQueryData.pagination,
                    total: Math.max(0, oldQueryData.pagination.total - 1),
                  },
                };
              }

              if (queryStatus === newStatus) {
                const alreadyExists = oldQueryData.data.some((t) => t._id === id);
                if (alreadyExists) return oldQueryData;

                const newList = [...oldQueryData.data];
                const movedItem = { ...todoToMove, status: newStatus };

                if (payload.beforeId) {
                  const idx = newList.findIndex((t) => t._id === payload.beforeId);
                  if (idx !== -1) {
                    newList.splice(idx, 0, movedItem);
                  } else {
                    newList.push(movedItem);
                  }
                } else if (payload.afterId) {
                  const idx = newList.findIndex((t) => t._id === payload.afterId);
                  if (idx !== -1) {
                    newList.splice(idx + 1, 0, movedItem);
                  } else {
                    newList.push(movedItem);
                  }
                } else {
                  newList.push(movedItem);
                }

                return {
                  ...oldQueryData,
                  data: newList,
                  pagination: {
                    ...oldQueryData.pagination,
                    total: oldQueryData.pagination.total + 1,
                  },
                };
              }

              if (queryStatus === '' || queryStatus === undefined) {
                return {
                  ...oldQueryData,
                  data: oldQueryData.data.map((t) =>
                    t._id === id ? { ...t, status: newStatus } : t
                  ),
                };
              }

              return oldQueryData;
            }
          );
        }
      }

      return { previousTodosQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTodosQueries) {
        context.previousTodosQueries.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosRootKey });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    string,
    { previousTodosQueries: [QueryKey, TodoListResponse | undefined][] }
  >({
    mutationFn: (id) => todosApi.deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todosRootKey });

      const previousTodosQueries = queryClient.getQueriesData<TodoListResponse>({
        queryKey: todosRootKey,
      });

      queryClient.setQueriesData<TodoListResponse>(
        { queryKey: todosRootKey },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((todo) => todo._id !== id),
            pagination: {
              ...oldData.pagination,
              total: Math.max(0, oldData.pagination.total - 1),
            },
          };
        }
      );

      return { previousTodosQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTodosQueries) {
        context.previousTodosQueries.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todosRootKey });
    },
  });
};
