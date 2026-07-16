const errorHandler = require('../middleware/errorHandler');

const response = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('errorHandler', () => {
  it.each([
    ['Cat already exists', 409],
    ['Cat not found', 404],
    ['Cat already adopted', 409],
    ['User already exists', 409],
    ['User not found', 404],
    ['Incorrect email or password', 401],
    ['You need to be logged in to access this route', 401],
    ["You don't have enough permission to perform this action", 401],
    ['No images were uploaded', 422],
    ['Invalid file type.', 422]
  ])('maps %s to HTTP %s', (message, status) => {
    const res = response();
    errorHandler(new Error(message), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({ error: message });
  });

  it('hides unexpected internal error details', () => {
    const res = response();
    errorHandler(new Error('database secret'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
