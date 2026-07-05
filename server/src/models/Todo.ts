import { InferSchemaType, Schema, model } from 'mongoose';

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export type Todo = InferSchemaType<typeof todoSchema>;
export type TodoPriority = Todo['priority'];
export type TodoStatus = Todo['status'];

export default model<Todo>('Todo', todoSchema);
