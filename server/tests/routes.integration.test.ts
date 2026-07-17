jest.mock('../controllers/userController', () => {
  const handler = name => (req, res) => res.status(200).json({ handler: name, params: req.params });
  return {
    signup: handler('signup'),
    login: handler('login'),
    getUser: handler('getUser'),
    getUsers: handler('getUsers'),
    updateUser: handler('updateUser'),
    deleteUser: handler('deleteUser'),
    allowIfLoggedin: (req, res, next) => next(),
    allowOwnerOrRoles: () => (req, res, next) => next(),
    allowRoles: () => (req, res, next) => next(),
    grantAccess: () => (req, res, next) => next()
  };
});

jest.mock('../controllers/adminController', () => {
  const handler = name => (req, res) => res.status(200).json({ handler: name, params: req.params });
  return {
    registerCat: handler('registerCat'),
    getCats: handler('getCats'),
    getAvailableCats: handler('getAvailableCats'),
    getCat: handler('getCat'),
    adoptCat: handler('adoptCat'),
    deprecatedAdoptCat: handler('deprecatedAdoptCat'),
    updateCat: handler('updateCat'),
    deleteCat: handler('deleteCat')
  };
});

jest.mock('multer', () => () => ({ array: () => (req, res, next) => next() }));
jest.mock('../util/multer', () => ({}));

const express = require('express');
const request = require('supertest');
const publicRoutes = require('../routes/route');
const adminRoutes = require('../routes/admin');

const app = express();
app.use(express.json());
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

describe('route integration contracts', () => {
  it.each([
    ['get', '/cats', 'getAvailableCats'],
    ['post', '/signup', 'signup'],
    ['post', '/login', 'login'],
    ['get', '/user/u1', 'getUser'],
    ['get', '/users', 'getUsers'],
    ['put', '/user/u1', 'updateUser'],
    ['delete', '/user/u1', 'deleteUser']
  ])('%s %s reaches %s', async (method, url, handler) => {
    const response = await request(app)[method](url).send({});
    expect(response.status).toBe(200);
    expect(response.body.handler).toBe(handler);
  });

  it.each([
    ['post', '/admin/registerCat', 'registerCat'],
    ['get', '/admin/cats', 'getCats'],
    ['get', '/admin/cat/c1', 'getCat'],
    ['put', '/admin/adoptCat/c1', 'deprecatedAdoptCat'],
    ['put', '/admin/cat/c1', 'updateCat'],
    ['delete', '/admin/cat/c1', 'deleteCat'],
    ['get', '/admin/user/u1', 'getUser'],
    ['get', '/admin/users', 'getUsers'],
    ['put', '/admin/user/u1', 'updateUser'],
    ['delete', '/admin/user/u1', 'deleteUser']
  ])('%s %s reaches %s', async (method, url, handler) => {
    const response = await request(app)[method](url).send({});
    expect(response.status).toBe(200);
    expect(response.body.handler).toBe(handler);
  });
});
