const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const validateRequest = require('../middlewares/validateRequest');
const {
  createTodo,
  deleteTodo,
  getTodo,
  getTodos,
  patchTodo,
  updateTodo,
} = require('../controllers/todoController');
const {
  createTodoValidation,
  listTodosValidation,
  patchTodoValidation,
  updateTodoValidation,
  validateId,
} = require('../validations/todoValidation');

const router = express.Router();

router
  .route('/')
  .get(listTodosValidation, validateRequest, asyncHandler(getTodos))
  .post(createTodoValidation, validateRequest, asyncHandler(createTodo));

router
  .route('/:id')
  .get(validateId, validateRequest, asyncHandler(getTodo))
  .put(updateTodoValidation, validateRequest, asyncHandler(updateTodo))
  .patch(patchTodoValidation, validateRequest, asyncHandler(patchTodo))
  .delete(validateId, validateRequest, asyncHandler(deleteTodo));

module.exports = router;
