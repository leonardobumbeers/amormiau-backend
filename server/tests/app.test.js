jest.mock('../../config/database.js', () => ({}));

const request = require('supertest');
const app = require('../server');

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
});
