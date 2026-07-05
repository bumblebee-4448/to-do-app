import type { NextFunction, Request, Response } from 'express';
import type { AppError } from './errorHandler';

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  (error as AppError).statusCode = 404;
  next(error);
};

export default notFound;
