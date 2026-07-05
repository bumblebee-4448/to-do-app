const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((error) => ({
      type: error.type,
      path: error.path,
      location: error.location,
      message: error.msg,
      value: error.value,
    })),
  });
};

module.exports = validateRequest;
