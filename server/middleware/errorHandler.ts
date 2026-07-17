import type { ErrorRequestHandler } from 'express';

const statusByMessage: Record<string, number> = {
  'Cat already exists': 409,
  'Cat not found': 404,
  'Cat already adopted': 409,
  'User already exists': 409,
  'User not found': 404,
  'Incorrect email or password': 401,
  'Email and password are required': 422,
  'Authentication service is not configured': 503,
  'You need to be logged in to access this route': 401,
  "You don't have enough permission to perform this action": 401,
  'No images were uploaded': 422,
  'Invalid file type.': 422,
  'Cat is not available for adoption': 409,
  'Adoption request already pending': 409,
  'Adoption decision must be approved or rejected': 422,
  'Pending adoption request not found': 404
};

interface MongoDuplicateError extends Error {
  code?: number;
}

const errorHandler: ErrorRequestHandler = (error: MongoDuplicateError, _req, res, _next) => {
  const isDuplicate = error.code === 11000;
  const status = isDuplicate ? 409 : (statusByMessage[error.message] || 500);
  const message = isDuplicate
    ? 'A user with these details already exists'
    : (status === 500 ? 'Internal server error' : error.message);

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
