import { useEffect, type ReactElement } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toInputDate } from '../../../utils/date';
import { todoDefaults, todoSchema, type TodoFormValues } from '../schemas/todoSchema';
import type { Todo } from '../types';
import { DatePicker } from '../../../components/ui/DatePicker';
import { DialogTitle } from '../../../components/ui/Dialog';

type TodoFormProps = {
  editingTodo: Todo | null;
  isSaving: boolean;
  onCancelEdit: () => void;
  onSubmit: (values: TodoFormValues) => void;
};

export const TodoForm = ({ editingTodo, isSaving, onCancelEdit, onSubmit }: TodoFormProps) => {
  const {
    control,
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
    <div style={{ background: 'var(--bg-surface)' }}>
      {/* Modal Header */}
      <div className="modal-header">
        <div>
          <DialogTitle asChild>
            <h2 className="modal-title">
              {editingTodo ? 'Chỉnh sửa công việc' : 'Thêm công việc'}
            </h2>
          </DialogTitle>
          <p style={{ marginTop: 2, fontSize: 12, color: 'var(--text-tertiary)' }}>
            Hãy giữ cho công việc rõ ràng, có thời hạn và dễ hoàn thành.
          </p>
        </div>
      </div>

      {/* Modal Body */}
      <form onSubmit={handleSubmit(submit)}>
        <div className="modal-body">
          <Field label="Tiêu đề" error={errors.title?.message}>
            <input
              id="title"
              type="text"
              placeholder="vd: Nghiên cứu xu hướng trang web"
              className="input"
              {...register('title')}
            />
          </Field>

          <Field label="Mô tả" error={errors.description?.message}>
            <textarea
              id="description"
              placeholder="Thêm chi tiết, liên kết hoặc ngữ cảnh..."
              className="input textarea"
              {...register('description')}
            />
          </Field>

          <Field label="Hạn chót" error={errors.dueDate?.message}>
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn hạn chót"
                />
              )}
            />
          </Field>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onCancelEdit}
            disabled={isSaving}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : editingTodo ? 'Lưu thay đổi' : 'Thêm công việc'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactElement<{ id: string; className?: string }>;
}) => (
  <div className="field">
    <label className="field__label" htmlFor={children.props.id}>
      {label}
    </label>
    {children}
    {error ? <p className="field__error">{error}</p> : null}
  </div>
);
