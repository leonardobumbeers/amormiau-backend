jest.mock('../../config/database.js', () => ({}));

const request = require('supertest');
const app = require('../../api');

describe('Vercel serverless handler', () => {
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
});
