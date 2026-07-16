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
});
