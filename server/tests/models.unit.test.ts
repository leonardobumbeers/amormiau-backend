const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/userModel');
const Cat = require('../models/catModel');

type RemoveHook = (this: { images: Array<{ key: string }> }) => void;

describe('mongoose models', () => {
  it('validates required user credentials', () => {
    const errors = new User({}).validateSync().errors;
    expect(errors.email.kind).toBe('required');
    expect(errors.password.kind).toBe('required');
  });

  it('defaults the user role and rejects invalid roles', () => {
    const user = new User({ email: 'user@example.com', password: 'hash' });
    expect(user.role).toBe('basic');

    user.role = 'root';
    expect(user.validateSync().errors.role.kind).toBe('enum');
  });

  it('validates required cat fields and applies defaults', () => {
    const invalidErrors = new Cat({}).validateSync().errors;
    expect(invalidErrors.name.kind).toBe('required');
    expect(invalidErrors.birthDate.kind).toBe('required');

    const cat = new Cat({ name: 'Miau', birthDate: '2020-01-01' });
    expect(cat.available).toBe(true);
    expect(cat.sociable).toBe(0);
    expect(cat.playful).toBe(0);
    expect(cat.affectionate).toBe(0);
  });

  it('casts cat references to ObjectIds', () => {
    const catId = new mongoose.Types.ObjectId();
    const user = new User({ email: 'user@example.com', password: 'hash', cats: [catId.toString()] });
    expect(user.cats[0]).toEqual(catId);
  });

  it('removes an uploaded image when a cat document is removed', async () => {
    const unlink = jest.spyOn(fs, 'unlink')
      .mockImplementation(((_file: string, callback: (error: null) => void) => callback(null)) as unknown as typeof fs.unlink);
    const removeHook = (Cat.schema.s.hooks._pres
      .get('remove')
      .map(hook => hook.fn)
      .find(hook => hook.name === '') as unknown as RemoveHook);

    removeHook.call({ images: [{ key: 'cat-image.jpg' }] });
    await Promise.resolve();

    expect(unlink).toHaveBeenCalledWith(
      path.resolve(__dirname, '..', '..', 'tmp', 'uploads', 'cat-image.jpg'),
      expect.any(Function)
    );
    unlink.mockRestore();
  });
});
