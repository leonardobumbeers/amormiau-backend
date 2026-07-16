jest.mock('../../config/database.js', () => ({}));

const request = require('supertest');
const app = require('../../index');

describe('Vercel serverless handler', () => {
  it('routes the homepage to the API documentation', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/docs');
  });
});
