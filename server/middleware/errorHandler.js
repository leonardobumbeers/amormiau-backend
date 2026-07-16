const statusByMessage = {
  'Cat already exists': 409,
  'Cat not found': 404,
  'Cat already adopted': 409,
  'User already exists': 409,
  'User not found': 404,
  'Incorrect email or password': 401,
  'You need to be logged in to access this route': 401,
  "You don't have enough permission to perform this action": 401,
  'No images were uploaded': 422,
  'Invalid file type.': 422,
  'Cat is not available for adoption': 409,
  'Adoption request already pending': 409,
  'Adoption decision must be approved or rejected': 422,
  'Pending adoption request not found': 404
};

module.exports = function errorHandler(error, req, res, next) {
  const status = statusByMessage[error.message] || 500;
  const message = status === 500 ? 'Internal server error' : error.message;

  res.status(status).json({ error: message });
};
