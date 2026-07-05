import express from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import validateRequest from '../middlewares/validateRequest';
import {
  createTodo,
  deleteTodo,
  getTodo,
  getTodos,
  patchTodo,
  updateTodo,
} from '../controllers/todoController';
import {
  createTodoValidation,
  listTodosValidation,
  patchTodoValidation,
  updateTodoValidation,
  validateId,
} from '../validations/todoValidation';

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

export default router;
