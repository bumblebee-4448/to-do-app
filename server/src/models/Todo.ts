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
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'incomplete', 'completed'],
      default: 'pending',
      index: true,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

todoSchema.index({ isDeleted: 1, status: 1, position: 1, _id: 1 });
todoSchema.index({ isDeleted: 1, status: 1, createdAt: -1, _id: -1 });
todoSchema.index({ isDeleted: 1, dueDate: 1, _id: 1 });
todoSchema.index({ title: 'text', description: 'text' });

export type Todo = InferSchemaType<typeof todoSchema>;
export type TodoStatus = Todo['status'];

export default model<Todo>('Todo', todoSchema);
