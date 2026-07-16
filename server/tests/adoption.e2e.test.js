const mockState = { users: [], cats: [], adoptions: [], nextId: 1 };
const mockId = () => (mockState.nextId++).toString(16).padStart(24, '0');
const mockQuery = value => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
  };
  return query;
};

jest.mock('mongoose', () => {
  const mongoose = jest.requireActual('mongoose');
  return {
    ...mongoose,
    startSession: jest.fn(async () => ({
    withTransaction: async callback => callback(),
    endSession: jest.fn(async () => {})
    }))
  };
});
jest.mock('bcrypt', () => ({
  hash: jest.fn(async password => `hashed:${password}`),
  compare: jest.fn(async (password, hash) => hash === `hashed:${password}`)
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'signed-access-token') }));
jest.mock('multer', () => () => ({ array: () => (req, res, next) => next() }));
jest.mock('../util/multer', () => ({}));

jest.mock('../models/userModel', () => {
  function User(data) {
    Object.assign(this, data, { _id: mockId('user') });
    this.save = jest.fn(async () => {
      if (!mockState.users.includes(this)) mockState.users.push(this);
      return this;
    });
  }
  User.findOne = jest.fn(async query => {
    const email = query.email && query.email.$eq ? query.email.$eq : query.email;
    return mockState.users.find(user => user.email === email) || null;
  });
  User.findById = jest.fn(id => mockQuery(
    mockState.users.find(user => String(user._id) === String(id)) || null
  ));
  User.findByIdAndUpdate = jest.fn(async (id, update) => {
    const user = mockState.users.find(item => item._id === id);
    if (user) Object.assign(user, update);
    return user;
  });
  return User;
});

jest.mock('../models/catModel', () => {
  function Cat(data) {
    Object.assign(this, data, { _id: mockId('cat') });
    this.save = jest.fn(async () => {
      if (!mockState.cats.includes(this)) mockState.cats.push(this);
      return this;
    });
  }
  Cat.findById = jest.fn(id => mockQuery(
    mockState.cats.find(cat => String(cat._id) === String(id)) || null
  ));
  return Cat;
});

jest.mock('../models/adoptionModel', () => {
  const Adoption = {};
  Adoption.create = jest.fn(async data => {
    const adoption = {
      ...data,
      _id: mockId('adoption'),
      status: 'pending',
      createdAt: new Date(),
      save: jest.fn(async function save() { return this; })
    };
    mockState.adoptions.push(adoption);
    return adoption;
  });
  Adoption.findOne = jest.fn(query => mockQuery(
    mockState.adoptions.find(adoption =>
      Object.entries(query).every(([key, value]) => String(adoption[key]) === String(value))
    ) || null
  ));
  Adoption.find = jest.fn(query => mockQuery(
    mockState.adoptions.filter(adoption =>
      Object.entries(query).every(([key, value]) => String(adoption[key]) === String(value))
    )
  ));
  Adoption.updateMany = jest.fn(async (query, update) => {
    const candidates = mockState.adoptions.filter(adoption =>
      adoption._id !== query._id.$ne && adoption.cat === query.cat && adoption.status === query.status
    );
    candidates.forEach(adoption => Object.assign(adoption, update.$set));
    return { modifiedCount: candidates.length };
  });
  return Adoption;
});

const express = require('express');
const request = require('supertest');
const publicRoutes = require('../routes/route');
const adoptionRoutes = require('../routes/adoptions');
const adminRoutes = require('../routes/admin');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const userId = req.get('x-test-user');
  if (userId) res.locals.loggedInUser = mockState.users.find(user => user._id === userId);
  next();
});
app.use('/', publicRoutes);
app.use('/adoptions', adoptionRoutes);
app.use('/admin', adminRoutes);
app.use(errorHandler);

describe('complete adoption HTTP journey', () => {
  beforeEach(() => {
    mockState.users.length = 0;
    mockState.cats.length = 0;
    mockState.adoptions.length = 0;
    mockState.nextId = 1;
    jest.clearAllMocks();

    const admin = {
      _id: 'admin-1', name: 'Admin', email: 'admin@amormiau.org',
      role: 'admin', cats: [], password: 'hash', accessToken: 'secret',
      save: jest.fn(async function save() { return this; })
    };
    const supervisor = {
      _id: 'supervisor-1', name: 'Supervisor', role: 'supervisor', cats: [],
      save: jest.fn(async function save() { return this; })
    };
    mockState.users.push(admin, supervisor);
  });

  it('preserves user, cat, request, reviewer, and approval data end to end', async () => {
    const signup = await request(app).post('/signup').send({
      name: 'Applicant', email: 'applicant@example.com',
      password: 'strong-password', role: 'admin'
    });
    expect(signup.status).toBe(200);
    expect(signup.body.data.role).toBe('basic');
    expect(signup.body.data).not.toHaveProperty('password');
    expect(signup.body.data).not.toHaveProperty('accessToken');
    const applicantId = signup.body.data._id;

    const secondSignup = await request(app).post('/signup').send({
      name: 'Second applicant', email: 'second@example.com', password: 'password'
    });
    const secondApplicantId = secondSignup.body.data._id;

    const catCreation = await request(app)
      .post('/admin/registerCat')
      .set('x-test-user', 'admin-1')
      .send({ name: 'Luna', birthDate: '2023-03-01', available: true });
    expect(catCreation.status).toBe(200);
    expect(catCreation.body.data).toMatchObject({ name: 'Luna', available: true });
    const catId = catCreation.body.data._id;

    const requestCreation = await request(app)
      .post('/adoptions')
      .set('x-test-user', applicantId)
      .send({ catId, userId: secondApplicantId });
    expect(requestCreation.status).toBe(201);
    expect(requestCreation.body.data).toMatchObject({
      user: applicantId, cat: catId, status: 'pending'
    });
    const requestId = requestCreation.body.data._id;

    const applicantHistory = await request(app)
      .get('/adoptions/me')
      .set('x-test-user', applicantId);
    expect(applicantHistory.status).toBe(200);
    expect(applicantHistory.body.data).toEqual([
      expect.objectContaining({ _id: requestId, user: applicantId, cat: catId })
    ]);

    const duplicate = await request(app)
      .post('/adoptions')
      .set('x-test-user', applicantId)
      .send({ catId });
    expect(duplicate.status).toBe(409);

    const competing = await request(app)
      .post('/adoptions')
      .set('x-test-user', secondApplicantId)
      .send({ catId });
    expect(competing.status).toBe(201);

    const forbiddenDecision = await request(app)
      .patch(`/admin/adoptions/${requestId}/decision`)
      .set('x-test-user', applicantId)
      .send({ decision: 'approved' });
    expect(forbiddenDecision.status).toBe(403);

    const approval = await request(app)
      .patch(`/admin/adoptions/${requestId}/decision`)
      .set('x-test-user', 'supervisor-1')
      .send({ decision: 'approved', reason: 'Home interview completed' });
    expect(approval.status).toBe(200);
    expect(approval.body.data).toMatchObject({
      _id: requestId,
      user: applicantId,
      cat: catId,
      status: 'approved',
      decidedBy: 'supervisor-1',
      decisionReason: 'Home interview completed'
    });
    expect(approval.body.data.decidedAt).toBeTruthy();

    const catAfterApproval = await request(app)
      .get(`/admin/cat/${catId}`)
      .set('x-test-user', 'supervisor-1');
    expect(catAfterApproval.body.data.available).toBe(false);

    const userAfterApproval = await request(app)
      .get(`/user/${applicantId}`)
      .set('x-test-user', applicantId);
    expect(userAfterApproval.body.data.cats).toContain(catId);
    expect(userAfterApproval.body.data).not.toHaveProperty('password');
    expect(userAfterApproval.body.data).not.toHaveProperty('accessToken');

    const reviewQueue = await request(app)
      .get('/admin/adoptions')
      .set('x-test-user', 'supervisor-1');
    expect(reviewQueue.status).toBe(200);
    expect(reviewQueue.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ _id: requestId, status: 'approved' }),
      expect.objectContaining({ user: secondApplicantId, status: 'rejected' })
    ]));

    const repeatedDecision = await request(app)
      .patch(`/admin/adoptions/${requestId}/decision`)
      .set('x-test-user', 'admin-1')
      .send({ decision: 'rejected' });
    expect(repeatedDecision.status).toBe(404);
    expect(userAfterApproval.body.data.cats).toEqual([catId]);
  });

  it('preserves user and cat data when a supervisor rejects the request', async () => {
    const applicant = {
      _id: 'applicant-1', role: 'basic', cats: [],
      save: jest.fn(async function save() { return this; })
    };
    const cat = {
      _id: '000000000000000000000101', name: 'Sol', available: true,
      save: jest.fn(async function save() { return this; })
    };
    mockState.users.push(applicant);
    mockState.cats.push(cat);

    const creation = await request(app)
      .post('/adoptions')
      .set('x-test-user', applicant._id)
      .send({ catId: cat._id });
    const requestId = creation.body.data._id;

    const invalid = await request(app)
      .patch(`/admin/adoptions/${requestId}/decision`)
      .set('x-test-user', 'supervisor-1')
      .send({ decision: 'maybe' });
    expect(invalid.status).toBe(422);
    expect(mockState.adoptions[0].status).toBe('pending');

    const rejection = await request(app)
      .patch(`/admin/adoptions/${requestId}/decision`)
      .set('x-test-user', 'supervisor-1')
      .send({ decision: 'rejected', reason: 'Housing is not ready yet' });

    expect(rejection.status).toBe(200);
    expect(rejection.body.data).toMatchObject({
      status: 'rejected',
      decidedBy: 'supervisor-1',
      decisionReason: 'Housing is not ready yet'
    });
    expect(cat.available).toBe(true);
    expect(applicant.cats).toEqual([]);
    expect(cat.save).not.toHaveBeenCalled();
    expect(applicant.save).not.toHaveBeenCalled();
  });

  it('rejects a malformed cat identifier before querying persistence', async () => {
    const applicant = {
      _id: 'applicant-1', role: 'basic', cats: [],
      save: jest.fn(async function save() { return this; })
    };
    mockState.users.push(applicant);

    const response = await request(app)
      .post('/adoptions')
      .set('x-test-user', applicant._id)
      .send({ catId: 'not-a-mongodb-object-id' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid catId' });
    expect(mockState.adoptions).toEqual([]);
  });
});
