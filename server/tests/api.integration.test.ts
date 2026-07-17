jest.mock('../models/userModel');
jest.mock('../models/catModel');
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));
jest.mock('multer', () => () => ({ array: () => (req, res, next) => next() }));
jest.mock('../util/multer', () => ({}));

const express = require('express');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Cat = require('../models/catModel');
const publicRoutes = require('../routes/route');
const adminRoutes = require('../routes/admin');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const role = req.get('x-test-role');
  if (role) res.locals.loggedInUser = {
    _id: req.get('x-test-user') || 'authenticated-user', role
  };
  next();
});
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use(errorHandler);

describe('HTTP API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'integration-secret';
  });

  describe('authentication', () => {
    it('signs up a user through the HTTP route and hashes the password', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(data => ({ ...data, _id: 'u1', save }));
      bcrypt.hash.mockResolvedValue('hashed-password');
      jwt.sign.mockReturnValue('access-token');

      const response = await request(app).post('/signup').send({
        name: 'Leonardo', email: 'leo@example.com', password: 'plain-password'
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: { email: 'leo@example.com', role: 'basic' },
        message: 'You have signed up successfully'
      });
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('accessToken');
      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(save).toHaveBeenCalledTimes(1);
    });

    it('returns 409 when the signup email already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing-user' });

      const response = await request(app)
        .post('/signup')
        .send({ email: 'existing@example.com', password: 'password' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'User already exists' });
    });

    it('returns 422 when signup credentials are missing', async () => {
      const response = await request(app).post('/signup').send({ name: 'No credentials' });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'Email and password are required' });
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('returns 409 for a duplicate unique identity field', async () => {
      const duplicate = Object.assign(new Error('duplicate key'), { code: 11000 });
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => ({ _id: 'u1', save: jest.fn().mockRejectedValue(duplicate) }));
      bcrypt.hash.mockResolvedValue('hashed-password');
      jwt.sign.mockReturnValue('access-token');

      const response = await request(app)
        .post('/signup')
        .send({ email: 'new@example.com', password: 'password', cpf: 'duplicate' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'A user with these details already exists' });
    });

    it('returns 503 when authentication is not configured', async () => {
      delete process.env.JWT_SECRET;
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(data => ({ ...data, _id: 'u1', save: jest.fn() }));
      bcrypt.hash.mockResolvedValue('hashed-password');

      const response = await request(app)
        .post('/signup')
        .send({ email: 'new@example.com', password: 'password' });

      expect(response.status).toBe(503);
      expect(response.body).toEqual({ error: 'Authentication service is not configured' });
    });

    it('logs in with valid credentials and persists the new token', async () => {
      User.findOne.mockResolvedValue({
        _id: 'u1', email: 'leo@example.com', password: 'stored-hash', role: 'admin'
      });
      User.findByIdAndUpdate.mockResolvedValue({});
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fresh-token');

      const response = await request(app)
        .post('/login')
        .send({ email: 'leo@example.com', password: 'correct-password' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: { email: 'leo@example.com', role: 'admin' }, accessToken: 'fresh-token'
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { accessToken: 'fresh-token' });
    });

    it.each([
      [{ email: 'missing@example.com', password: 'password' }, null, true],
      [{ email: 'leo@example.com', password: 'wrong' }, { _id: 'u1', password: 'hash' }, false],
      [{ email: { $ne: null }, password: 'password' }, null, true]
    ])('returns 401 for invalid login input %#', async (payload, user, passwordMatches) => {
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(passwordMatches);

      const response = await request(app).post('/login').send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Incorrect email or password' });
    });
  });

  describe('authorization', () => {
    it('rejects anonymous requests to protected endpoints', async () => {
      const response = await request(app).get('/admin/cats');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('You need to be logged in to access this route');
      expect(Cat.find).not.toHaveBeenCalled();
    });

    it('rejects a basic user from admin-only operations', async () => {
      const response = await request(app)
        .delete('/admin/cat/c1')
        .set('x-test-role', 'basic');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("You don't have enough permission to perform this action");
    });

    it('allows a supervisor to read cats', async () => {
      Cat.find.mockResolvedValue([{ _id: 'c1', name: 'Miau' }]);

      const response = await request(app)
        .get('/admin/cats')
        .set('x-test-role', 'supervisor');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([{ _id: 'c1', name: 'Miau' }]);
    });
  });

  describe('user management', () => {
    it('returns a user with populated cat records', async () => {
      const populate = jest.fn().mockResolvedValue({
        _id: 'u1', email: 'leo@example.com', cats: [{ _id: 'c1', name: 'Miau' }]
      });
      User.findById.mockReturnValue({ populate });

      const response = await request(app)
        .get('/user/u1')
        .set('x-test-role', 'basic')
        .set('x-test-user', 'u1');

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        _id: 'u1', email: 'leo@example.com', cats: [{ _id: 'c1' }]
      });
      expect(populate).toHaveBeenCalledWith('cats');
    });

    it('returns 404 when a requested user does not exist', async () => {
      User.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const response = await request(app)
        .get('/user/missing')
        .set('x-test-role', 'basic')
        .set('x-test-user', 'missing');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('allows a supervisor to list users with their cats', async () => {
      const populate = jest.fn().mockResolvedValue([
        { _id: 'u1', role: 'basic', cats: [{ _id: 'c1' }] },
        { _id: 'u2', role: 'supervisor', cats: [] }
      ]);
      User.find.mockReturnValue({ populate });

      const response = await request(app)
        .get('/users')
        .set('x-test-role', 'supervisor');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(populate).toHaveBeenCalledWith('cats');
    });

    it('updates a user and hashes the replacement password', async () => {
      const user = { _id: 'u1', save: jest.fn() };
      user.save.mockImplementation(async () => user);
      User.findById.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      bcrypt.hash.mockResolvedValue('replacement-hash');

      const response = await request(app)
        .put('/user/u1')
        .set('x-test-role', 'admin')
        .send({
          email: 'updated@example.com', password: 'replacement-password',
          role: 'supervisor', cats: ['c1']
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        email: 'updated@example.com', role: 'supervisor', cats: ['c1']
      });
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.message).toBe('User has been updated successfully!');
    });

    it('deletes a user through an admin-authorized route', async () => {
      User.findByIdAndDelete.mockResolvedValue({ _id: 'u1' });

      const response = await request(app)
        .delete('/user/u1')
        .set('x-test-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: null, message: 'User has been deleted' });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
    });

    it('allows a basic user to delete their own account', async () => {
      User.findByIdAndDelete.mockResolvedValue({ _id: 'u1' });

      const response = await request(app)
        .delete('/user/u1')
        .set('x-test-role', 'basic')
        .set('x-test-user', 'u1');

      expect(response.status).toBe(200);
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
    });

    it('prevents a basic user from deleting another account', async () => {
      const response = await request(app)
        .delete('/user/victim-user')
        .set('x-test-role', 'basic')
        .set('x-test-user', 'attacker-user');

      expect(response.status).toBe(403);
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('hides unexpected persistence errors from API clients', async () => {
      User.findByIdAndDelete.mockRejectedValue(new Error('mongodb credentials leaked'));

      const response = await request(app)
        .delete('/user/u1')
        .set('x-test-role', 'admin');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('prevents a basic user from reading another user profile', async () => {
      const response = await request(app)
        .get('/user/victim-user')
        .set('x-test-role', 'basic')
        .set('x-test-user', 'attacker-user');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'You can only access your own personal data'
      });
      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe('cat management', () => {
    it('lists only available cats without requiring authentication', async () => {
      Cat.find.mockResolvedValue([{ _id: 'c1', name: 'Miau', available: true }]);

      const response = await request(app).get('/cats');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([{ _id: 'c1', name: 'Miau', available: true }]);
      expect(Cat.find).toHaveBeenCalledWith({ available: true });
    });

    it('returns one available cat without requiring authentication', async () => {
      Cat.findOne.mockResolvedValue({ _id: 'c1', name: 'Miau', available: true });

      const response = await request(app).get('/cats/c1');

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ _id: 'c1', name: 'Miau' });
      expect(Cat.findOne).toHaveBeenCalledWith({ _id: 'c1', available: true });
    });

    it('does not expose an unavailable cat through the public detail route', async () => {
      Cat.findOne.mockResolvedValue(null);

      const response = await request(app).get('/cats/unavailable');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Cat not found' });
    });

    it('registers a cat through the admin API', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      Cat.mockImplementation(data => ({ ...data, _id: 'c1', save }));

      const response = await request(app)
        .post('/admin/registerCat')
        .set('x-test-role', 'admin')
        .send({ name: 'Miau', birthDate: '2022-01-01', sex: 'Macho', playful: 4 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: { _id: 'c1', name: 'Miau', sex: 'Macho', playful: 4, images: [] },
        message: 'Cat is registered successfully'
      });
      expect(save).toHaveBeenCalledTimes(1);
    });

    it('returns 404 for a missing cat', async () => {
      Cat.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/admin/cat/missing')
        .set('x-test-role', 'supervisor');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Cat not found' });
    });

    it('updates a cat through the admin API', async () => {
      const cat = { _id: 'c1', save: jest.fn() };
      cat.save.mockImplementation(async () => cat);
      Cat.findById.mockResolvedValueOnce(cat).mockResolvedValueOnce(cat);

      const response = await request(app)
        .put('/admin/cat/c1')
        .set('x-test-role', 'admin')
        .send({ name: 'Miau II', available: false, playful: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ name: 'Miau II', available: false, playful: 5 });
      expect(response.body.message).toBe('Cat is updated successfully');
    });

    it('blocks the legacy direct-adoption endpoint', async () => {
      const response = await request(app)
        .put('/admin/adoptCat/c1')
        .set('x-test-role', 'admin')
        .send({ userId: 'u1' });

      expect(response.status).toBe(410);
      expect(response.body.error).toContain('Direct adoption is disabled');
      expect(User.findById).not.toHaveBeenCalled();
      expect(Cat.findById).not.toHaveBeenCalled();
    });

    it('deletes a cat through the admin API', async () => {
      const remove = jest.fn().mockResolvedValue(undefined);
      Cat.findById.mockResolvedValue({ _id: 'c1', remove });

      const response = await request(app)
        .delete('/admin/cat/c1')
        .set('x-test-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Cat is deleted successfully' });
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });
});
