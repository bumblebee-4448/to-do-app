const mongoose = require('mongoose');
const Todo = require('../models/Todo');

const editableFields = ['title', 'description', 'priority', 'dueDate', 'status'];

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pickEditableFields = (payload) =>
  editableFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      result[field] = payload[field] === '' && field === 'dueDate' ? null : payload[field];
    }
    return result;
  }, {});

const findTodoOrFail = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(404, 'Todo not found');
  }

  const todo = await Todo.findById(id);

  if (!todo) {
    throw createError(404, 'Todo not found');
  }

  return todo;
};

const getTodos = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const filter = {};

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

const getTodo = async (req, res) => {
  const todo = await findTodoOrFail(req.params.id);

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const createTodo = async (req, res) => {
  const todo = await Todo.create(pickEditableFields(req.body));

  res.status(201).json({
    success: true,
    data: todo,
  });
};

const updateTodo = async (req, res) => {
  await findTodoOrFail(req.params.id);

  const todo = await Todo.findByIdAndUpdate(req.params.id, pickEditableFields(req.body), {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const patchTodo = async (req, res) => {
  await findTodoOrFail(req.params.id);

  const todo = await Todo.findByIdAndUpdate(req.params.id, pickEditableFields(req.body), {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: todo,
  });
};

const deleteTodo = async (req, res) => {
  await findTodoOrFail(req.params.id);
  await Todo.findByIdAndDelete(req.params.id);

  res.status(204).send();
};

module.exports = {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  patchTodo,
  deleteTodo,
};
