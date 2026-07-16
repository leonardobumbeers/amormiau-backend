jest.mock('../models/userModel');
jest.mock('../models/catModel');

const User = require('../models/userModel');
const Cat = require('../models/catModel');
const controller = require('../controllers/adminController');
const { createMockResponse: response } = require('./helpers/mockResponse');

interface AdoptionUserMock { cats?: string[]; save: jest.Mock }
interface AdoptionCatMock { available?: boolean; save: jest.Mock }

describe('adminController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, files: [], user: undefined };
    res = response();
    next = jest.fn();
  });

  it('allows logged-in users and enforces role permissions', async () => {
    res.locals.loggedInUser = { role: 'admin' };
    await controller.allowIfLoggedin(req, res, next);
    expect(req.user).toEqual({ role: 'admin' });

    next.mockClear();
    await controller.grantAccess('deleteAny', 'profile')(req, res, next);
    expect(next).toHaveBeenCalledWith();

    next.mockClear();
    req.user = { role: 'basic' };
    await controller.grantAccess('deleteAny', 'profile')(req, res, next);
    expect(next.mock.calls[0][0].message).toBe("You don't have enough permission to perform this action");
  });

  it('rejects anonymous users', async () => {
    await controller.allowIfLoggedin(req, res, next);
    expect(next.mock.calls[0][0].message).toBe('You need to be logged in to access this route');
  });

  it('registers a cat and maps uploaded image metadata', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    Cat.mockImplementation(data => ({ ...data, save }));
    req.body = { name: 'Miau', birthDate: '2020-01-01', available: false };
    req.files = [{ originalname: 'cat.png', key: 'key-cat.png', size: 12, destination: '/uploads' }];

    await controller.registerCat(req, res, next);

    expect(save).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0]).toMatchObject({
      data: {
        name: 'Miau',
        images: [{ fileName: 'cat.png', key: 'key-cat.png', size: 12, dest: '/uploads' }]
      },
      message: 'Cat is registered successfully'
    });
  });

  it('registers a cat without images and forwards save failures', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    Cat.mockImplementationOnce(data => ({ ...data, save }));
    delete req.files;
    await controller.registerCat(req, res, next);
    expect(res.json.mock.calls[0][0].data.images).toEqual([]);

    res = response();
    next.mockClear();
    Cat.mockImplementationOnce(data => ({ ...data, save: jest.fn().mockRejectedValue(new Error('save failed')) }));
    await controller.registerCat(req, res, next);
    expect(next.mock.calls[0][0].message).toBe('save failed');
  });

  it('lists cats', async () => {
    Cat.find.mockResolvedValue([{ _id: 'c1' }]);
    await controller.getCats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: [{ _id: 'c1' }] });
  });

  it('gets a cat or forwards not-found', async () => {
    req.params.catId = 'c1';
    Cat.findById.mockResolvedValueOnce({ _id: 'c1' });
    await controller.getCat(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ data: { _id: 'c1' } });

    next.mockClear();
    Cat.findById.mockResolvedValueOnce(null);
    await controller.getCat(req, res, next);
    expect(next.mock.calls[0][0].message).toBe('Cat not found');
  });

  it('updates a cat or forwards not-found', async () => {
    const cat = { save: jest.fn().mockResolvedValue({ _id: 'c1', name: 'Updated' }) };
    Cat.findById.mockResolvedValueOnce(cat).mockResolvedValueOnce(cat);
    req.params.catId = 'c1';
    req.body = { name: 'Updated', available: false, playful: 4 };
    await controller.updateCat(req, res, next);
    expect(cat).toMatchObject({ name: 'Updated', available: false, playful: 4 });
    expect(res.json.mock.calls[0][0]).toMatchObject({ message: 'Cat is updated successfully' });

    res = response();
    next.mockClear();
    Cat.findById.mockResolvedValueOnce(null);
    await controller.updateCat(req, res, next);
    expect(next.mock.calls[0][0].message).toBe('Cat not found');
  });

  it('adopts a cat for an existing user', async () => {
    const user: AdoptionUserMock = { save: jest.fn().mockResolvedValue({ _id: 'u1', cats: ['c1'] }) };
    const cat: AdoptionCatMock = { save: jest.fn().mockResolvedValue({ _id: 'c1', available: false }) };
    User.findOneAndUpdate.mockResolvedValue(null);
    User.findById.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    Cat.findById.mockResolvedValueOnce(cat).mockResolvedValueOnce(cat);
    req.params.catId = 'c1';
    req.body.userId = 'u1';

    await controller.adoptCat(req, res, next);

    expect(Cat.findById).toHaveBeenCalledWith('c1');
    expect(cat.available).toBe(false);
    expect(user.cats).toEqual(['c1']);
    expect(res.json.mock.calls[0][0]).toMatchObject({ message: 'Cat and User updated successfully' });
  });

  it('rejects adoption for a missing user or cat', async () => {
    User.findOneAndUpdate.mockResolvedValue(null);
    User.findById.mockResolvedValueOnce(null);
    req.params.catId = 'c1';
    req.body.userId = 'missing';
    await controller.adoptCat(req, res, next);
    expect(next.mock.calls[0][0].message).toBe('User not found');

    next.mockClear();
    User.findById.mockResolvedValueOnce({ _id: 'u1' });
    Cat.findById.mockResolvedValueOnce(null);
    await controller.adoptCat(req, res, next);
    expect(next.mock.calls[0][0].message).toBe('Cat not found');
  });

  it('deletes a cat and rejects a missing cat', async () => {
    const cat = { remove: jest.fn().mockResolvedValue(undefined) };
    req.params.catId = 'c1';
    Cat.findById.mockResolvedValueOnce(cat);
    await controller.deleteCat(req, res, next);
    expect(cat.remove).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Cat is deleted successfully' });

    next.mockClear();
    Cat.findById.mockResolvedValueOnce(null);
    await controller.deleteCat(req, res, next);
    expect(next.mock.calls[0][0].message).toBe('Cat not found');
  });
});
