jest.mock('../../config/database.js', () => ({ connectDatabase: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../models/userModel');
jest.mock('../models/catModel');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../../config/database');
const User = require('../models/userModel');
const Cat = require('../models/catModel');
const app = require('../server');

describe('deployed application system boundaries', () => {
  let consoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.JWT_SECRET = 'system-test-secret';
    connectDatabase.mockResolvedValue({});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('authenticates a valid JWT and serves an authorized request', async () => {
    jwt.verify.mockReturnValue({
      userId: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600
    });
    User.findById.mockResolvedValue({ _id: 'admin-1', role: 'admin' });
    Cat.find.mockResolvedValue([{ _id: 'c1', name: 'Miau' }]);

    const response = await request(app)
      .get('/admin/cats')
      .set('x-access-token', 'valid-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ _id: 'c1', name: 'Miau' }]);
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'system-test-secret');
    expect(User.findById).toHaveBeenCalledWith('admin-1');
  });

  it('rejects an expired JWT before reaching a controller', async () => {
    jwt.verify.mockReturnValue({
      userId: 'admin-1', exp: Math.floor(Date.now() / 1000) - 1
    });

    const response = await request(app)
      .get('/admin/cats')
      .set('x-access-token', 'expired-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('JWT token has expired');
    expect(Cat.find).not.toHaveBeenCalled();
  });

  it('does not expose token verification errors', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('jwt malformed'); });

    const response = await request(app)
      .get('/admin/cats')
      .set('x-access-token', 'malformed-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  it('returns service unavailable when MongoDB cannot accept API traffic', async () => {
    connectDatabase.mockRejectedValue(new Error('connection refused'));

    const response = await request(app).get('/admin/cats');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Database unavailable' });
    expect(Cat.find).not.toHaveBeenCalled();
  });

  it('exposes rate-limit headers on public endpoints', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBe('100');
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
  });

  it('sets privacy-oriented response headers and hides the framework', async () => {
    const response = await request(app).get('/');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['permissions-policy'])
      .toBe('camera=(), microphone=(), geolocation=()');
  });

  it('serves a bundled static upload without requiring MongoDB', async () => {
    connectDatabase.mockRejectedValue(new Error('database should not be used'));

    const response = await request(app).get('/files/img.example.jpg');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/jpeg');
    expect(connectDatabase).not.toHaveBeenCalled();
  });
});
