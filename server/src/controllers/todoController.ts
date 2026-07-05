import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Todo, { type Todo as TodoShape, type TodoPriority, type TodoStatus } from '../models/Todo';
import type { AppError } from '../middlewares/errorHandler';

type EditableTodoPayload = Partial<{
  title: string;
  description: string;
  priority: TodoPriority;
  dueDate: Date | string | null;
  status: TodoStatus;
}>;

type TodoListQuery = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  status?: TodoStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  order?: 'asc' | 'desc';
};

type TodoFilter = Partial<Pick<TodoShape, 'status'>> & {
  $or?: Array<{ title: RegExp } | { description: RegExp }>;
};

const editableFields = ['title', 'description', 'priority', 'dueDate', 'status'] as const;

const createError = (statusCode: number, message: string): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pickEditableFields = (payload: Record<string, unknown>): EditableTodoPayload =>
  editableFields.reduce<EditableTodoPayload>((result, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      Object.assign(result, {
        [field]: payload[field] === '' && field === 'dueDate' ? null : payload[field],
      });
    }
    return result;
  }, {});

const findTodoOrFail = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw createError(404, 'Todo not found');
  }

  const todo = await Todo.findById(id);

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  return todo;
};

const getTodos = async (req: Request<object, object, object, TodoListQuery>, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const filter: TodoFilter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const total = await Todo.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);
  const todos = await Todo.find(filter)
    .sort({ [sortBy]: order, _id: order })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    data: todos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

const getTodo = async (req: Request<{ id: string }>, res: Response) => {
  const todo = await findTodoOrFail(req.params.id);

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const createTodo = async (req: Request<object, object, EditableTodoPayload>, res: Response) => {
  const todo = await Todo.create(pickEditableFields(req.body));

  res.status(201).json({
    success: true,
    data: todo,
  });
};

const updateTodo = async (req: Request<{ id: string }, object, EditableTodoPayload>, res: Response) => {
  await findTodoOrFail(req.params.id);

  const todo = await Todo.findByIdAndUpdate(req.params.id, pickEditableFields(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const patchTodo = async (req: Request<{ id: string }, object, EditableTodoPayload>, res: Response) => {
  await findTodoOrFail(req.params.id);

  const todo = await Todo.findByIdAndUpdate(req.params.id, pickEditableFields(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const deleteTodo = async (req: Request<{ id: string }>, res: Response) => {
  await findTodoOrFail(req.params.id);
  await Todo.findByIdAndDelete(req.params.id);

  res.status(204).send();
};

export {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  patchTodo,
  deleteTodo,
};
