import type { TodoStatus } from '../features/todos/types';

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toInputDateSafe = (value?: string | null) => {
  const date = parseDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
};

export const formatDueDateSafe = (value?: string | null) => {
  const date = parseDate(value);
  if (!value) {
    return 'Không có hạn chót';
  }

  if (!date) {
    return 'Ngày không hợp lệ';
  }

  return new Intl.DateTimeFormat('vi', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const isOverdueSafe = (value: string | null | undefined, status: TodoStatus) => {
  const dueDate = parseDate(value);
  if (!dueDate || status === 'completed') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};
