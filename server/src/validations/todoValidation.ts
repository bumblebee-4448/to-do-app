import { Types } from 'mongoose';
import { body, param, query } from 'express-validator';

const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'title', 'position'];
const allowedStatuses = ['pending', 'incomplete', 'completed'];

const validateId = [
  param('id')
    .custom((value: string) => Types.ObjectId.isValid(value))
    .withMessage('Todo not found'),
];

const titleRule = () =>
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters');

const descriptionRule = () =>
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters');

const dueDateRule = () =>
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .toDate();

const statusRule = () =>
  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage('Status must be pending, incomplete, or completed');

const requiredStatusRule = () =>
  body('status')
    .exists({ values: 'falsy' })
    .withMessage('Status is required')
    .bail()
    .isIn(allowedStatuses)
    .withMessage('Status must be pending, incomplete, or completed');

const createTodoValidation = [
  titleRule(),
  descriptionRule(),
  dueDateRule(),
  statusRule(),
];

const patchTodoValidation = [
  ...validateId,
  body().custom((_value, { req }) => {
    const allowedFields = ['title', 'description', 'dueDate', 'status'];
    return allowedFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
  }).withMessage('At least one editable field is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  descriptionRule(),
  dueDateRule(),
  statusRule(),
];

const moveTodoValidation = [
  ...validateId,
  requiredStatusRule(),
  body('beforeId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value: string) => Types.ObjectId.isValid(value))
    .withMessage('Invalid beforeId'),
  body('afterId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value: string) => Types.ObjectId.isValid(value))
    .withMessage('Invalid afterId'),
];

const listTodosValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt(),
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Search cannot exceed 100 characters'),
  query('status').optional({ checkFalsy: true }).isIn(allowedStatuses).withMessage('Status must be incomplete or completed'),
  query('sortBy').optional({ checkFalsy: true }).isIn(allowedSortFields).withMessage('Invalid sort field'),
  query('order').optional({ checkFalsy: true }).isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

export {
  createTodoValidation,
  patchTodoValidation,
  moveTodoValidation,
  listTodosValidation,
  validateId,
};
