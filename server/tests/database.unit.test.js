const loadDatabase = ({ mongoUrl, readyState = 0, connect }) => {
  jest.resetModules();
  process.env.MONGODB_URL = mongoUrl;
  const connection = { readyState, on: jest.fn() };
  const mongoose = {
    Promise,
    set: jest.fn(),
    connect: connect || jest.fn(),
    connection
  };
  jest.doMock('mongoose', () => mongoose);
  const database = require('../../config/database');
  return { ...database, mongoose, connection };
};

describe('database connection', () => {
  afterEach(() => {
    delete process.env.MONGODB_URL;
    jest.resetModules();
    jest.dontMock('mongoose');
  });

  it('rejects when MONGODB_URL is missing', async () => {
    const { connectDatabase, mongoose } = loadDatabase({ mongoUrl: '' });
    await expect(connectDatabase()).rejects.toThrow('MONGODB_URL is not configured');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('reuses an existing connected mongoose connection', async () => {
    const { connectDatabase, connection, mongoose } = loadDatabase({ mongoUrl: 'mongodb://test', readyState: 1 });
    await expect(connectDatabase()).resolves.toBe(connection);
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('caches an in-flight connection promise', async () => {
    let resolveConnection;
    const pending = new Promise(resolve => { resolveConnection = resolve; });
    const connect = jest.fn(() => pending);
    const { connectDatabase } = loadDatabase({ mongoUrl: 'mongodb://test', connect });
    const first = connectDatabase();
    const second = connectDatabase();
    resolveConnection({ ready: true });
    await expect(first).resolves.toEqual({ ready: true });
    await expect(second).resolves.toEqual({ ready: true });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith('mongodb://test', { serverSelectionTimeoutMS: 10000 });
  });

  it('allows retrying after a failed connection', async () => {
    const connect = jest.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ready: true });
    const { connectDatabase } = loadDatabase({ mongoUrl: 'mongodb://test', connect });
    await expect(connectDatabase()).rejects.toThrow('offline');
    await expect(connectDatabase()).resolves.toEqual({ ready: true });
    expect(connect).toHaveBeenCalledTimes(2);
  });
});
