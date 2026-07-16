jest.mock('../models/userModel');
jest.mock('../models/catModel', () => ({}));
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const controller = require('../controllers/userController');

const response = () => {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.locals = {};
  return res;
};

describe('userController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    req = { body: {}, params: {}, user: undefined };
    res = response();
    next = jest.fn();
  });

  describe('authentication and authorization middleware', () => {
    it('allows a logged-in user', async () => {
      res.locals.loggedInUser = { role: 'basic' };
      await controller.allowIfLoggedin(req, res, next);
      expect(req.user).toEqual({ role: 'basic' });
      expect(next).toHaveBeenCalledWith();
    });

    it('rejects an anonymous user', async () => {
      await controller.allowIfLoggedin(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('You need to be logged in to access this route');
    });

    it('allows an authorized role and rejects an unauthorized role', async () => {
      req.user = { role: 'admin' };
      await controller.grantAccess('deleteAny', 'profile')(req, res, next);
      expect(next).toHaveBeenCalledWith();

      next.mockClear();
      req.user = { role: 'basic' };
      await controller.grantAccess('deleteAny', 'profile')(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "You don't have enough permission to perform this action"
      });
    });

    it('allows profile owners and privileged readers but rejects other users', () => {
      req.params.userId = 'u1';
      req.user = { _id: 'u1', role: 'basic' };
      controller.allowOwnerOrRoles('supervisor', 'admin')(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      next.mockClear();
      req.user = { _id: 'supervisor-1', role: 'supervisor' };
      controller.allowOwnerOrRoles('supervisor', 'admin')(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      next.mockClear();
      req.user = { _id: 'other-user', role: 'basic' };
      controller.allowOwnerOrRoles('supervisor', 'admin')(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('signup', () => {
    it('creates a basic user with a hashed password and token', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      User.mockImplementation(data => ({ ...data, _id: 'user-1', save }));
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-password');
      jwt.sign.mockReturnValue('signed-token');
      req.body = { name: 'Leo', email: 'leo@example.com', password: 'plain' };

      await controller.signup(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-1' },
        'test-secret',
        { expiresIn: '1d' }
      );
      expect(save).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toMatchObject({
        data: { email: 'leo@example.com', role: 'basic' },
        message: 'You have signed up successfully'
      });
      expect(res.json.mock.calls[0][0].data).not.toHaveProperty('password');
      expect(res.json.mock.calls[0][0].data).not.toHaveProperty('accessToken');
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards duplicate-user errors', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });
      req.body = { email: 'exists@example.com' };
      await controller.signup(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('User already exists');
    });

    it('ignores attempts to self-register with an administrative role', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(data => ({ ...data, _id: 'u1', save }));
      bcrypt.hash.mockResolvedValue('hash');
      jwt.sign.mockReturnValue('token');
      req.body = {
        email: 'attacker@example.com', password: 'password', role: 'admin'
      };

      await controller.signup(req, res, next);

      expect(res.json.mock.calls[0][0].data.role).toBe('basic');
    });
  });

  describe('login', () => {
    it('rejects malformed emails, unknown users, and bad passwords', async () => {
      req.body = { email: { $ne: null }, password: 'x' };
      await controller.login(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('Incorrect email or password');

      next.mockClear();
      req.body = { email: 'missing@example.com', password: 'x' };
      User.findOne.mockResolvedValue(null);
      await controller.login(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('Incorrect email or password');

      next.mockClear();
      User.findOne.mockResolvedValue({ _id: 'u1', password: 'hash' });
      bcrypt.compare.mockResolvedValue(false);
      await controller.login(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('Incorrect email or password');
    });

    it('returns and persists a token for valid credentials', async () => {
      const user = { _id: 'u1', email: 'user@example.com', role: 'basic', password: 'hash' };
      req.body = { email: user.email, password: 'plain' };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');
      User.findByIdAndUpdate.mockResolvedValue(user);

      await controller.login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: { $eq: user.email } });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { accessToken: 'token' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { email: user.email, role: 'basic' },
        accessToken: 'token'
      });
    });
  });

  describe('user CRUD', () => {
    it('lists users with populated cats', async () => {
      const populate = jest.fn().mockResolvedValue([{ _id: 'u1' }]);
      User.find.mockReturnValue({ populate });
      await controller.getUsers(req, res, next);
      expect(populate).toHaveBeenCalledWith('cats');
      expect(res.json).toHaveBeenCalledWith({ data: [{ _id: 'u1' }] });
    });

    it('gets a user or forwards not-found', async () => {
      const populate = jest.fn().mockResolvedValue({ _id: 'u1' });
      User.findById.mockReturnValueOnce({ populate });
      req.params.userId = 'u1';
      await controller.getUser(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ data: { _id: 'u1' } });

      res = response();
      next.mockClear();
      User.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(null) });
      await controller.getUser(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('User not found');
    });

    it('updates an existing user and hashes the new password', async () => {
      const user = { save: jest.fn().mockResolvedValue({ _id: 'u1', email: 'new@example.com' }) };
      User.findById.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      bcrypt.hash.mockResolvedValue('new-hash');
      req.params.userId = 'u1';
      req.body = { email: 'new@example.com', password: 'new-password', role: 'admin', cats: ['c1'] };

      await controller.updateUser(req, res, next);

      expect(user).toMatchObject({ email: 'new@example.com', password: 'new-hash', role: 'admin', cats: ['c1'] });
      expect(res.json.mock.calls[0][0]).toMatchObject({ message: 'User has been updated successfully!' });
    });

    it('forwards update not-found and delete failures', async () => {
      User.findById.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hash');
      req.params.userId = 'missing';
      req.body.password = 'password';
      await controller.updateUser(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('User not found');

      next.mockClear();
      User.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));
      await controller.deleteUser(req, res, next);
      expect(next.mock.calls[0][0].message).toBe('delete failed');
    });

    it('deletes a user', async () => {
      req.params.userId = 'u1';
      User.findByIdAndDelete.mockResolvedValue({ _id: 'u1' });
      await controller.deleteUser(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ data: null, message: 'User has been deleted' });
    });
  });
});
