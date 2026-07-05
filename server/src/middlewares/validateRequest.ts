import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((error) => ({
      type: error.type,
      path: 'path' in error ? error.path : undefined,
      location: 'location' in error ? error.location : undefined,
      message: error.msg,
      value: 'value' in error ? error.value : undefined,
    })),
  });
};

export default validateRequest;
