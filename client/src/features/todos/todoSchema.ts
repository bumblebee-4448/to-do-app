import { z } from 'zod';
import type { TodoCreatePayload } from './types';

const todayAtMidnight = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự'),
  description: z
    .string()
    .trim()
    .max(500, 'Mô tả không được vượt quá 500 ký tự')
    .optional()
    .or(z.literal('')),

  dueDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => {
      if (!value) return true;
      return new Date(`${value}T00:00:00`) >= todayAtMidnight();
    }, 'Hạn chót không được ở quá khứ'),
});

export type TodoFormValues = z.infer<typeof todoSchema>;

export const todoDefaults: TodoFormValues = {
  title: '',
  description: '',
  dueDate: '',
};

export const toTodoPayload = (values: TodoFormValues): TodoCreatePayload => ({
  title: values.title.trim(),
  description: values.description?.trim() || '',
  dueDate: values.dueDate ? new Date(`${values.dueDate}T12:00:00`).toISOString() : null,
});
