import type { NextFunction, Request, Response } from 'express';
import type { Error as MongooseError } from 'mongoose';

export interface AppError extends Error {
  statusCode?: number;
  errors?: unknown[];
  path?: string;
}

const isMongooseValidationError = (err: unknown): err is MongooseError.ValidationError =>
  err instanceof Error && err.name === 'ValidationError' && 'errors' in err;

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (isMongooseValidationError(err)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: (Object.values(err.errors) as Array<MongooseError.ValidatorError | MongooseError.CastError>).map(
        (error) => ({
          path: error.path,
          message: error.message,
        }),
      ),
    });
  }

  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Todo not found',
      errors: [],
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
};

export default errorHandler;
