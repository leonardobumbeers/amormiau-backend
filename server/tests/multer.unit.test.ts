const path = require('path');
const config = require('../util/multer');

describe('multer configuration', () => {
  it('stores uploads in tmp/uploads with a 15 MB limit', () => {
    expect(config.dest).toBe(path.resolve(__dirname, '..', '..', 'tmp', 'uploads'));
    expect(config.limits.fileSize).toBe(15 * 1024 * 1024);
  });

  it.each(['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif'])(
    'accepts %s uploads',
    mimetype => {
      const callback = jest.fn();
      config.fileFilter({}, { mimetype }, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    }
  );

  it('rejects non-image uploads', () => {
    const callback = jest.fn();
    config.fileFilter({}, { mimetype: 'application/javascript' }, callback);
    expect(callback.mock.calls[0][0].message).toBe('Invalid file type.');
  });

  it('configures disk destination and generates a collision-resistant filename', () => {
    let storageOptions;
    jest.isolateModules(() => {
      jest.doMock('multer', () => ({
        diskStorage: jest.fn(options => {
          storageOptions = options;
          return options;
        })
      }));
      jest.doMock('crypto', () => ({
        randomBytes: jest.fn((size, callback) => callback(null, Buffer.from('abc123')))
      }));
      require('../util/multer');
    });

    const destinationCallback = jest.fn();
    storageOptions.destination({}, {}, destinationCallback);
    expect(destinationCallback).toHaveBeenCalledWith(
      null, path.resolve(__dirname, '..', '..', 'tmp', 'uploads')
    );

    const file: any = { originalname: 'miau.jpg' };
    const filenameCallback = jest.fn();
    storageOptions.filename({}, file, filenameCallback);
    expect(file.key).toBe(`${Buffer.from('abc123').toString('hex')}-miau.jpg`);
    expect(filenameCallback).toHaveBeenCalledWith(null, file.key);

    jest.dontMock('multer');
    jest.dontMock('crypto');
  });
});
