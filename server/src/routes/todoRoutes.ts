import express from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import validateRequest from '../middlewares/validateRequest';
import {
  createTodo,
  deleteTodo,
  getTodo,
  getTodos,
  moveTodo,
  patchTodo,
} from '../controllers/todoController';
import {
  createTodoValidation,
  listTodosValidation,
  moveTodoValidation,
  patchTodoValidation,
  validateId,
} from '../validations/todoValidation';

const router = express.Router();

router
  .route('/')
  .get(listTodosValidation, validateRequest, asyncHandler(getTodos))
  .post(createTodoValidation, validateRequest, asyncHandler(createTodo));

router
  .route('/:id/move')
  .patch(moveTodoValidation, validateRequest, asyncHandler(moveTodo));

router
  .route('/:id')
  .get(validateId, validateRequest, asyncHandler(getTodo))
  .patch(patchTodoValidation, validateRequest, asyncHandler(patchTodo))
  .delete(validateId, validateRequest, asyncHandler(deleteTodo));

export default router;
