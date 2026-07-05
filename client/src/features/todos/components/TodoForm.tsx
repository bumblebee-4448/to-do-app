import { useEffect, type ReactElement } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { toInputDate } from '../../../utils/date';
import { todoDefaults, todoSchema, type TodoFormValues } from '../schemas/todoSchema';
import type { Todo } from '../types';

type TodoFormProps = {
  editingTodo: Todo | null;
  isSaving: boolean;
  onCancelEdit: () => void;
  onSubmit: (values: TodoFormValues) => void;
};

export const TodoForm = ({ editingTodo, isSaving, onCancelEdit, onSubmit }: TodoFormProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: todoDefaults,
  });

  useEffect(() => {
    if (editingTodo) {
      reset({
        title: editingTodo.title,
        description: editingTodo.description || '',
        priority: editingTodo.priority,
        dueDate: toInputDate(editingTodo.dueDate),
      });
      return;
    }

    reset(todoDefaults);
  }, [editingTodo, reset]);

  const submit = (values: TodoFormValues) => {
    onSubmit(values);
    if (!editingTodo) {
      reset(todoDefaults);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {editingTodo ? 'Edit task' : 'Add task'}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Keep the task clear, dated, and easy to finish.
          </p>
        </div>
        {editingTodo ? (
          <Button
            variant="ghost"
            className="h-9 w-9 px-0"
            aria-label="Cancel editing"
            title="Cancel editing"
            onClick={onCancelEdit}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Field label="Title" error={errors.title?.message}>
          <Input id="title" placeholder="Draft project notes" {...register('title')} />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <Textarea
            id="description"
            placeholder="Add the context that future you will need."
            {...register('description')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority" error={errors.priority?.message}>
            <Select id="priority" {...register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>

          <Field label="Due date" error={errors.dueDate?.message}>
            <Input id="dueDate" type="date" {...register('dueDate')} />
          </Field>
        </div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {editingTodo ? 'Save changes' : 'Add task'}
        </Button>
      </form>
    </Card>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactElement<{ id: string }>;
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor={children.props.id}>
      {label}
    </label>
    {children}
    {error ? <p className="mt-1.5 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
  </div>
);
