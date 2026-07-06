import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Todo, { type Todo as TodoShape, type TodoStatus } from '../models/Todo';
import type { AppError } from '../middlewares/errorHandler';

type EditableTodoPayload = Partial<{
  title: string;
  description: string;
  dueDate: Date | string | null;
  status: TodoStatus;
}>;

type TodoListQuery = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  status?: TodoStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'title' | 'position';
  order?: 'asc' | 'desc';
};

type TodoFilter = Partial<Pick<TodoShape, 'status'>> & {
  $or?: Array<{ title: RegExp } | { description: RegExp }>;
};

const editableFields = ['title', 'description', 'dueDate', 'status'] as const;

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

  const todo = await Todo.findOne({ _id: id, isDeleted: { $ne: true } });

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
  const filter: TodoFilter & { isDeleted?: { $ne: boolean } } = { isDeleted: { $ne: true } };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const total = await Todo.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
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


const patchTodo = async (req: Request<{ id: string }, object, EditableTodoPayload>, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError(404, 'Todo not found');
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    pickEditableFields(req.body),
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const getNeighborPosition = async (id: string | null | undefined, status: TodoStatus) => {
  if (!id) {
    return null;
  }

  const todo = await Todo.findOne({ _id: id, status, isDeleted: { $ne: true } })
    .select('position')
    .lean();

  return typeof todo?.position === 'number' ? todo.position : null;
};

const computePosition = (afterPosition: number | null, beforePosition: number | null) => {
  if (afterPosition !== null && beforePosition !== null) {
    return (afterPosition + beforePosition) / 2;
  }

  if (afterPosition !== null) {
    return afterPosition + 1000;
  }

  if (beforePosition !== null) {
    return beforePosition - 1000;
  }

  return Date.now();
};

const moveTodo = async (
  req: Request<{ id: string }, object, { status: TodoStatus; beforeId?: string | null; afterId?: string | null }>,
  res: Response,
) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError(404, 'Todo not found');
  }

  const afterPosition = await getNeighborPosition(req.body.afterId, req.body.status);
  const beforePosition = await getNeighborPosition(req.body.beforeId, req.body.status);
  const position = computePosition(afterPosition, beforePosition);

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { status: req.body.status, position },
    { returnDocument: 'after', runValidators: true },
  );

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const deleteTodo = async (req: Request<{ id: string }>, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw createError(404, 'Todo not found');
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { returnDocument: 'after' },
  );

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  res.status(204).send();
};

export {
  getTodos,
  getTodo,
  createTodo,
  patchTodo,
  moveTodo,
  deleteTodo,
};
