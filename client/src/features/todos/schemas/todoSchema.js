import { z } from 'zod';

const todayAtMidnight = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => {
      if (!value) return true;
      return new Date(`${value}T00:00:00`) >= todayAtMidnight();
    }, 'Due date cannot be in the past'),
});

export const todoDefaults = {
  title: '',
  description: '',
  priority: 'low',
  dueDate: '',
};

export const toTodoPayload = (values) => ({
  title: values.title.trim(),
  description: values.description?.trim() || '',
  priority: values.priority,
  dueDate: values.dueDate ? new Date(`${values.dueDate}T12:00:00`).toISOString() : undefined,
});
