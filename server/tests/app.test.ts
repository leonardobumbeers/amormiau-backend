jest.mock('../../config/database', () => ({
  connectDatabase: jest.fn().mockRejectedValue(new Error('MongoDB unavailable'))
}));

const request = require('supertest');
const app = require('../server');
const { connectDatabase } = require('../../config/database');

describe('application endpoints', () => {
  it('serves API status from the homepage', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: 'amormiau-backend',
      status: 'ok',
      database: 'disconnected',
      docs: '/docs'
    });
  });

  it('reports that MongoDB is unavailable when disconnected', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'unavailable',
      database: 'disconnected'
    });
  });

  it('waits for MongoDB before reporting a healthy connection', async () => {
    connectDatabase.mockResolvedValueOnce({});

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });

  it('serves the Swagger stylesheet as CSS', async () => {
    const response = await request(app).get('/docs/swagger-ui.css');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^text\/css/);
    expect(response.text).toContain('.swagger-ui');
  });
});
