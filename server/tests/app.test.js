jest.mock('../../config/database.js', () => ({}));

const request = require('supertest');
const app = require('../server');

describe('application endpoints', () => {
  it('routes the homepage to the API documentation', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/docs');
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
