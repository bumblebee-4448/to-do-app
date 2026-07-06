import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import App from '../app/App';
import { queryClient } from '../lib/queryClient';
import type {
  ApiSuccess,
  Todo,
  TodoCreatePayload,
  TodoFilters,
  TodoListResponse,
  TodoPatchPayload,
  TodoUpdatePayload,
} from '../features/todos/types';

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
}

vi.mock('sonner', async () => {
  const actual = await vi.importActual<typeof import('sonner')>('sonner');
  return {
    ...actual,
    toast: toastMock,
  };
});

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
    status: 'incomplete',
    dueDate: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

const chooseStatusFilter = async (user: ReturnType<typeof userEvent.setup>, optionName: RegExp) => {
  await user.click(screen.getByRole('combobox', { name: /trạng thái/i }));
  await user.click(await screen.findByRole('option', { name: optionName }));
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
      const todo = makeTodo({ ...payload, status: 'incomplete' });
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
    moveTodo: vi.fn(async (id: string, payload: { status: Todo['status']; beforeId?: string | null; afterId?: string | null }): Promise<ApiSuccess<Todo>> => {
      const index = apiState.todos.findIndex((todo) => todo._id === id);
      apiState.todos[index] = {
        ...apiState.todos[index],
        status: payload.status,
        position: Date.now(),
      };
      return { success: true, data: apiState.todos[index] };
    }),
    deleteTodo: vi.fn(async (id: string): Promise<void> => {
      apiState.todos = apiState.todos.filter((todo) => todo._id !== id);
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  apiState.nextId = 1;
  apiState.todos = [
    makeTodo({
      title: 'Write React tests',
      description: 'Cover the dashboard flow.',
      status: 'incomplete',
    }),
    makeTodo({
      title: 'Buy groceries',
      description: 'Pick up coffee and fruit.',
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

    expect(screen.getByRole('heading', { name: /danh sách việc cần làm/i })).toBeInTheDocument();
    expect(await screen.findByText('Write React tests')).toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  test('renders todo-focused sidebar actions and feature menu', () => {
    render(<App />);

    const sidebar = screen.getByRole('complementary');

    expect(within(sidebar).getByRole('button', { name: /thêm việc mới/i })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /tìm kiếm công việc/i })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /bảng công việc/i })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /danh sách công việc/i })).toBeInTheDocument();
    expect(within(sidebar).queryByText(/hộp thư/i)).not.toBeInTheDocument();
    expect(within(sidebar).queryByText(/thông báo/i)).not.toBeInTheDocument();
    expect(within(sidebar).queryByText(/hóa đơn/i)).not.toBeInTheDocument();
  });

  test('orders view tabs to match the sidebar feature flow', () => {
    render(<App />);

    const tablist = screen.getByRole('tablist', { name: /chế độ hiển thị/i });
    const tabs = within(tablist).getAllByRole('tab').map((tab) => tab.textContent);

    expect(tabs).toEqual(['Bảng', 'Danh sách']);
  });

  test('sidebar shortcuts navigate and filter the task dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    const sidebar = screen.getByRole('complementary');
    await screen.findByText('Write React tests');

    await user.click(within(sidebar).getByRole('button', { name: /tìm kiếm công việc/i }));
    expect(screen.getByPlaceholderText(/tìm kiếm.../i)).toHaveFocus();
  });

  test('uses an inset floating sidebar layout', () => {
    render(<App />);

    const sidebar = screen.getByRole('complementary');
    const shell = sidebar.parentElement;
    const main = screen.getByRole('main');

    expect(shell).toHaveClass('app-shell', 'app-shell--floating-sidebar', 'app-shell--unified-surface');
    expect(sidebar).toHaveClass('sidebar', 'sidebar--floating', 'sidebar--muted-surface');
    expect(sidebar.getAttribute('style') || '').not.toContain('border-right');
    expect(main).toHaveClass('main-content', 'main-content--floating-sidebar', 'main-content--plain-surface');
  });

  test('applies soft dashboard entrance classes on initial render', () => {
    render(<App />);

    const sidebar = screen.getByRole('complementary');
    const shell = sidebar.parentElement;
    const main = screen.getByRole('main');
    const contentShell = screen.getByRole('region', { name: /nội dung dashboard/i });

    expect(shell).toHaveClass('dashboard-enter');
    expect(sidebar).toHaveClass('dashboard-enter__sidebar');
    expect(main).toHaveClass('dashboard-enter__main');
    expect(contentShell).toHaveClass('dashboard-enter__content');
  });

  test('drags a task card between board columns', async () => {
    const { todosApi } = await import('../features/todos/api/todosApi');
    render(<App />);

    const card = await screen.findByTestId('todo-item-Write React tests');
    const doneColumn = screen.getByRole('region', { name: /^hoàn thành$/i });
    const dataTransfer = {
      data: {} as Record<string, string>,
      dropEffect: '',
      effectAllowed: '',
      setData(type: string, value: string) {
        this.data[type] = value;
      },
      getData(type: string) {
        return this.data[type] ?? '';
      },
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(doneColumn, { dataTransfer });
    fireEvent.drop(doneColumn, { dataTransfer });

    await waitFor(() => {
      expect(within(doneColumn).getByText('Write React tests')).toBeInTheDocument();
      expect(
        within(doneColumn).getByRole('button', {
          name: /đánh dấu "Write React tests" là chưa hoàn thành/i,
        }),
      ).toBeInTheDocument();
    });
    expect(vi.mocked(todosApi.moveTodo)).toHaveBeenCalledWith('1', {
      status: 'completed',
      beforeId: null,
      afterId: '2',
    });
  });

  test('board paginates each column instead of hiding tasks after the first page', async () => {
    const user = userEvent.setup();
    apiState.nextId = 1;
    apiState.todos = Array.from({ length: 12 }, (_, index) =>
      makeTodo({
        title: `Pending board task ${String(index + 1).padStart(2, '0')}`,
        description: `Board task ${index + 1}`,
        status: 'pending',
      }),
    );

    render(<App />);

    const listColumn = await screen.findByRole('region', { name: /danh sách công việc/i });
    expect(await within(listColumn).findByText('Pending board task 01')).toBeInTheDocument();
    expect(within(listColumn).queryByText('Pending board task 11')).not.toBeInTheDocument();

    await user.click(within(listColumn).getByRole('button', { name: /trang sau/i }));

    expect(await within(listColumn).findByText('Pending board task 11')).toBeInTheDocument();
  });

  test('only activates the sidebar backdrop when the mobile menu is open', async () => {
    const user = userEvent.setup();
    render(<App />);

    const backdrop = document.querySelector('.sidebar-backdrop');

    expect(backdrop).not.toHaveClass('sidebar-backdrop--visible');

    await user.click(screen.getByRole('button', { name: /open sidebar/i }));

    expect(backdrop).toHaveClass('sidebar-backdrop--visible');
  });

  test('opens the create form from the sidebar action', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      within(screen.getByRole('complementary')).getByRole('button', {
        name: /thêm việc mới/i,
      }),
    );

    expect(await screen.findByRole('heading', { name: /^thêm công việc$/i })).toBeInTheDocument();
  });

  test('task form opens as an accessible dialog and closes with escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /thêm việc mới/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('creates a todo through the form', async () => {
    const user = userEvent.setup();
    render(<App />);

    const main = screen.getByRole('main');
    await user.click(within(main).getByRole('button', { name: /thêm việc mới/i }));

    await user.type(screen.getByLabelText(/tiêu đề/i), 'Study optimistic updates');
    await user.type(screen.getByLabelText(/mô tả/i), 'Keep the interface fast and honest.');
    await user.click(screen.getByRole('button', { name: /^thêm công việc$/i }));

    expect(await screen.findByText('Study optimistic updates')).toBeInTheDocument();
  });

  test('does not leak a pending create into the completed board filter while saving', async () => {
    const { todosApi } = await import('../features/todos/api/todosApi');
    vi.mocked(todosApi.createTodo).mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /bộ lọc/i }));
    await chooseStatusFilter(user, /^hoàn thành$/i);
    expect(await screen.findByText('Buy groceries')).toBeInTheDocument();

    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /thêm việc mới/i }));
    await user.type(screen.getByLabelText(/tiêu đề/i), 'Pending should not leak');
    await user.click(screen.getByRole('button', { name: /^thêm công việc$/i }));

    await waitFor(() => {
      expect(screen.queryByText('Pending should not leak')).not.toBeInTheDocument();
    });
  });

  test('shows mutation error toast from component ownership only', async () => {
    const { todosApi } = await import('../features/todos/api/todosApi');
    vi.mocked(todosApi.createTodo).mockRejectedValueOnce(new Error('Server rejected create'));

    const user = userEvent.setup();
    render(<App />);

    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /thêm việc mới/i }));
    await user.type(screen.getByLabelText(/tiêu đề/i), 'Will fail');
    await user.click(screen.getByRole('button', { name: /^thêm công việc$/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledTimes(1);
      expect(toastMock.error).toHaveBeenCalledWith('Server rejected create');
    });
  });

  test('shows validation feedback for short titles', async () => {
    const user = userEvent.setup();
    render(<App />);

    const main = screen.getByRole('main');
    await user.click(within(main).getByRole('button', { name: /thêm việc mới/i }));

    await user.type(screen.getByLabelText(/tiêu đề/i), 'No');
    await user.click(screen.getByRole('button', { name: /^thêm công việc$/i }));

    expect(await screen.findByText(/tiêu đề phải có ít nhất 3 ký tự/i)).toBeInTheDocument();
  });

  test('toggles a todo completion state', async () => {
    const user = userEvent.setup();
    render(<App />);

    const item = await screen.findByTestId('todo-item-Write React tests');
    await user.click(within(item).getByRole('button', { name: /đánh dấu "Write React tests" là hoàn thành/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /đánh dấu "Write React tests" là chưa hoàn thành/i })).toBeInTheDocument();
    });
  });

  test('searches and filters todos', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Write React tests');
    await user.type(screen.getByPlaceholderText(/tìm kiếm.../i), 'react');

    await waitFor(() => {
      expect(screen.getByText('Write React tests')).toBeInTheDocument();
      expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();
    });

    await user.clear(screen.getByPlaceholderText(/tìm kiếm.../i));

    await user.click(screen.getByRole('button', { name: /bộ lọc/i }));
    await chooseStatusFilter(user, /^hoàn thành$/i);

    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.queryByText('Write React tests')).not.toBeInTheDocument();
    });
  });

  test('switches to list view and paginates todos', async () => {
    const user = userEvent.setup();
    apiState.nextId = 1;
    apiState.todos = Array.from({ length: 12 }, (_, index) =>
      makeTodo({
        title: `Task ${String(index + 1).padStart(2, '0')}`,
        description: `Generated task ${index + 1}`,
        status: 'incomplete',
      }),
    );

    render(<App />);

    await user.click(screen.getByRole('tab', { name: /danh sách/i }));

    expect(await screen.findByText('Task 01')).toBeInTheDocument();
    expect(screen.queryByText('Task 11')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));

    expect(await screen.findByText('Task 11')).toBeInTheDocument();
    expect(screen.getByText('Task 12')).toBeInTheDocument();
  });

  test('returns to a valid page after deleting the last item on the last page', async () => {
    const user = userEvent.setup();
    apiState.nextId = 1;
    apiState.todos = Array.from({ length: 11 }, (_, index) =>
      makeTodo({
        title: `Delete pagination task ${String(index + 1).padStart(2, '0')}`,
        description: `Task ${index + 1}`,
        status: 'incomplete',
      }),
    );

    render(<App />);
    await user.click(screen.getByRole('tab', { name: /danh sách/i }));
    await user.click(await screen.findByRole('button', { name: '2' }));
    expect(await screen.findByText('Delete pagination task 11')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /xóa Delete pagination task 11/i }));
    await user.click(screen.getByRole('button', { name: /^xóa$/i }));

    expect(await screen.findByText('Delete pagination task 01')).toBeInTheDocument();
  });

  test('keeps all dashboard views inside the same content shell', async () => {
    const user = userEvent.setup();
    render(<App />);

    const contentShell = screen.getByRole('region', { name: /nội dung dashboard/i });
    expect(contentShell).toHaveClass('dashboard-content');
    expect(contentShell).toHaveAttribute('data-view', 'board');

    await user.click(screen.getByRole('tab', { name: /danh sách/i }));
    expect(screen.getByRole('region', { name: /nội dung dashboard/i })).toBe(contentShell);
    expect(contentShell).toHaveAttribute('data-view', 'list');
  });
  // Grouped tasks view removed — out of scope
});
