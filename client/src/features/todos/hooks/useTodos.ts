import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { todosApi } from '../api/todosApi';
import type {
  ApiSuccess,
  Todo,
  TodoCreatePayload,
  TodoFilters,
  TodoListResponse,
  TodoPatchPayload,
  TodoUpdatePayload,
} from '../types';

const todosRootKey = ['todos'] as const;
type TodosQueryKey = ['todos', TodoFilters];
type TodosInfiniteData = InfiniteData<TodoListResponse, number>;
type CacheSnapshot = Array<[readonly unknown[], TodosInfiniteData | undefined]>;
type MutationContext = { previous: CacheSnapshot };

const snapshotTodos = (queryClient: QueryClient): CacheSnapshot =>
  queryClient.getQueriesData<TodosInfiniteData>({ queryKey: todosRootKey });

const restoreTodos = (queryClient: QueryClient, snapshot: CacheSnapshot = []) => {
  snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
};

const mapInfiniteTodos = (
  data: TodosInfiniteData | undefined,
  mapper: (todo: Todo) => Todo,
): TodosInfiniteData | undefined => {
  if (!data?.pages) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map(mapper),
    })),
  };
};

const filterInfiniteTodos = (
  data: TodosInfiniteData | undefined,
  predicate: (todo: Todo) => boolean,
): TodosInfiniteData | undefined => {
  if (!data?.pages) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.filter(predicate),
      pagination: {
        ...page.pagination,
        total: Math.max((page.pagination?.total || 1) - 1, 0),
      },
    })),
  };
};

const prependInfiniteTodo = (
  data: TodosInfiniteData | undefined,
  todo: Todo,
): TodosInfiniteData | undefined => {
  if (!data?.pages?.length) return data;
  const [firstPage, ...rest] = data.pages;
  return {
    ...data,
    pages: [
      {
        ...firstPage,
        data: [todo, ...firstPage.data],
        pagination: {
          ...firstPage.pagination,
          total: (firstPage.pagination?.total || 0) + 1,
        },
      },
      ...rest,
    ],
  };
};

export const useTodos = (filters: TodoFilters) =>
  useInfiniteQuery<TodoListResponse, Error, TodosInfiniteData, TodosQueryKey, number>({
    queryKey: ['todos', filters],
    queryFn: ({ pageParam = 1 }) =>
      todosApi.getTodos({
        ...filters,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNextPage ? lastPage.pagination.page + 1 : undefined,
  });

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiSuccess<Todo>, Error, TodoCreatePayload, MutationContext>({
    mutationFn: (payload) => todosApi.createTodo(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: todosRootKey });
      const previous = snapshotTodos(queryClient);
      const now = new Date().toISOString();
      const optimisticTodo = {
        _id: `optimistic-${now}`,
        title: payload.title,
        description: payload.description || '',
        priority: payload.priority || 'low',
        dueDate: payload.dueDate || null,
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      };

      queryClient.setQueriesData<TodosInfiniteData>({ queryKey: todosRootKey }, (data) =>
        prependInfiniteTodo(data, optimisticTodo),
      );
      return { previous };
    },
    onError: (error, payload, context) => restoreTodos(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSuccess<Todo>,
    Error,
    { id: string; payload: TodoUpdatePayload },
    MutationContext
  >({
    mutationFn: ({ id, payload }) => todosApi.updateTodo(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: todosRootKey });
      const previous = snapshotTodos(queryClient);
      queryClient.setQueriesData<TodosInfiniteData>({ queryKey: todosRootKey }, (data) =>
        mapInfiniteTodos(data, (todo) => (todo._id === id ? { ...todo, ...payload } : todo)),
      );
      return { previous };
    },
    onError: (error, variables, context) => restoreTodos(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const usePatchTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiSuccess<Todo>,
    Error,
    { id: string; payload: TodoPatchPayload },
    MutationContext
  >({
    mutationFn: ({ id, payload }) => todosApi.patchTodo(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: todosRootKey });
      const previous = snapshotTodos(queryClient);
      queryClient.setQueriesData<TodosInfiniteData>({ queryKey: todosRootKey }, (data) =>
        mapInfiniteTodos(data, (todo) => (todo._id === id ? { ...todo, ...payload } : todo)),
      );
      return { previous };
    },
    onError: (error, variables, context) => restoreTodos(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, MutationContext>({
    mutationFn: (id) => todosApi.deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todosRootKey });
      const previous = snapshotTodos(queryClient);
      queryClient.setQueriesData<TodosInfiniteData>({ queryKey: todosRootKey }, (data) =>
        filterInfiniteTodos(data, (todo) => todo._id !== id),
      );
      return { previous };
    },
    onError: (error, id, context) => restoreTodos(queryClient, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosRootKey }),
  });
};
