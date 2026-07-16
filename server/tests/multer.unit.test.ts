const path = require('path');
const config = require('../util/multer');

interface TestUploadFile { originalname: string; key?: string }
interface StorageOptions {
  destination: (request: object, file: object, callback: jest.Mock) => void;
  filename: (request: object, file: TestUploadFile, callback: jest.Mock) => void;
}

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
    let storageOptions: StorageOptions | undefined;
    jest.isolateModules(() => {
      jest.doMock('multer', () => ({
        diskStorage: jest.fn((options: StorageOptions) => {
          storageOptions = options;
          return options;
        })
      }));
      jest.doMock('crypto', () => ({
        randomBytes: jest.fn((_size: number, callback: (error: null, value: Buffer) => void) => callback(null, Buffer.from('abc123')))
      }));
      require('../util/multer');
    });

    const destinationCallback = jest.fn();
    expect(storageOptions).toBeDefined();
    const configuredStorage = storageOptions as StorageOptions;
    configuredStorage.destination({}, {}, destinationCallback);
    expect(destinationCallback).toHaveBeenCalledWith(
      null, path.resolve(__dirname, '..', '..', 'tmp', 'uploads')
    );

    const file: TestUploadFile = { originalname: 'miau.jpg' };
    const filenameCallback = jest.fn();
    configuredStorage.filename({}, file, filenameCallback);
    expect(file.key).toBe(`${Buffer.from('abc123').toString('hex')}-miau.jpg`);
    expect(filenameCallback).toHaveBeenCalledWith(null, file.key);

    jest.dontMock('multer');
    jest.dontMock('crypto');
  });
});
