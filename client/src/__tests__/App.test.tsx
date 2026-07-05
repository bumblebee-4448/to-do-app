import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import App from '../App';
import { queryClient } from '../config/queryClient';
import type {
  ApiSuccess,
  Todo,
  TodoCreatePayload,
  TodoFilters,
  TodoListResponse,
  TodoPatchPayload,
  TodoUpdatePayload,
} from '../features/todos/types';

type MockTodoParams = TodoFilters & { page?: number };
type ApiState = {
  todos: Todo[];
  nextId: number;
};

const apiState = vi.hoisted(
  (): ApiState => ({
  todos: [],
  nextId: 1,
  }),
);

const makeTodo = (overrides: Partial<Todo> = {}): Todo => {
  const now = new Date('2026-07-05T12:00:00.000Z').toISOString();
  return {
    _id: String(apiState.nextId++),
    title: 'Plan the week',
    description: 'Choose the next useful step.',
    priority: 'low',
    status: 'pending',
    dueDate: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

vi.mock('../features/todos/api/todosApi', () => ({
  todosApi: {
    getTodos: vi.fn(
      async ({
        page = 1,
        limit = 10,
        search = '',
        status = '',
        sortBy = 'createdAt',
        order = 'desc',
      }: Partial<MockTodoParams> = {}): Promise<TodoListResponse> => {
      let rows = [...apiState.todos];
      const keyword = search.toLowerCase();

      if (keyword) {
        rows = rows.filter((todo) =>
          `${todo.title} ${todo.description}`.toLowerCase().includes(keyword),
        );
      }

      if (status) {
        rows = rows.filter((todo) => todo.status === status);
      }

      rows.sort((a, b) => {
        const first = a[sortBy] || '';
        const second = b[sortBy] || '';
        return order === 'asc' ? String(first).localeCompare(String(second)) : String(second).localeCompare(String(first));
      });

      const total = rows.length;
      const start = (page - 1) * limit;
      const data = rows.slice(start, start + limit);

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    }),
    createTodo: vi.fn(async (payload: TodoCreatePayload): Promise<ApiSuccess<Todo>> => {
      const todo = makeTodo({ ...payload, status: 'pending' });
      apiState.todos.unshift(todo);
      return { success: true, data: todo };
    }),
    updateTodo: vi.fn(async (id: string, payload: TodoUpdatePayload): Promise<ApiSuccess<Todo>> => {
      const index = apiState.todos.findIndex((todo) => todo._id === id);
      apiState.todos[index] = { ...apiState.todos[index], ...payload };
      return { success: true, data: apiState.todos[index] };
    }),
    patchTodo: vi.fn(async (id: string, payload: TodoPatchPayload): Promise<ApiSuccess<Todo>> => {
      const index = apiState.todos.findIndex((todo) => todo._id === id);
      apiState.todos[index] = { ...apiState.todos[index], ...payload };
      return { success: true, data: apiState.todos[index] };
    }),
    deleteTodo: vi.fn(async (id: string): Promise<void> => {
      apiState.todos = apiState.todos.filter((todo) => todo._id !== id);
    }),
  },
}));

beforeEach(() => {
  apiState.nextId = 1;
  apiState.todos = [
    makeTodo({
      title: 'Write React tests',
      description: 'Cover the dashboard flow.',
      priority: 'high',
      status: 'pending',
    }),
    makeTodo({
      title: 'Buy groceries',
      description: 'Pick up coffee and fruit.',
      priority: 'low',
      status: 'completed',
    }),
  ];
  queryClient.clear();
  localStorage.clear();
  document.documentElement.className = '';
});

describe('Todo dashboard', () => {
  test('renders the working dashboard', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /today's work/i })).toBeInTheDocument();
    expect(await screen.findByText('Write React tests')).toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  test('creates a todo through the form', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/title/i), 'Study optimistic updates');
    await user.type(screen.getByLabelText(/description/i), 'Keep the interface fast and honest.');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'medium');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(await screen.findByText('Study optimistic updates')).toBeInTheDocument();
  });

  test('shows validation feedback for short titles', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/title/i), 'No');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(await screen.findByText(/title must be at least 3 characters/i)).toBeInTheDocument();
  });

  test('toggles a todo completion state', async () => {
    const user = userEvent.setup();
    render(<App />);

    const item = await screen.findByTestId('todo-item-Write React tests');
    await user.click(within(item).getByRole('checkbox', { name: /mark write react tests complete/i }));

    await waitFor(() => {
      expect(within(item).getByText(/completed/i)).toBeInTheDocument();
    });
  });

  test('searches and filters todos', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Write React tests');
    await user.type(screen.getByLabelText(/search tasks/i), 'react');

    await waitFor(() => {
      expect(screen.getByText('Write React tests')).toBeInTheDocument();
      expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/search tasks/i));
    await user.selectOptions(screen.getByLabelText(/status/i), 'completed');

    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.queryByText('Write React tests')).not.toBeInTheDocument();
    });
  });
});
