export const toInputDate = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

export const formatDueDate = (value) => {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

export const isOverdue = (value, status) => {
  if (!value || status === 'completed') return false;
  const dueDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};
