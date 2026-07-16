const fetch = require('cross-fetch');

const baseUrl = process.env.PRODUCTION_URL?.replace(/\/$/, '');
const attempts = Number(process.env.SMOKE_ATTEMPTS || 6);
const retryDelayMs = Number(process.env.SMOKE_RETRY_DELAY_MS || 5000);

if (!baseUrl) {
  throw new Error('PRODUCTION_URL is required, for example https://api.example.com');
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function getWithRetry(path, expectedStatus) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { 'user-agent': 'amormiau-production-smoke-test' },
        timeout: 15000
      });

      if (response.status === expectedStatus) return response;

      const body = await response.text();
      lastError = new Error(
        `${path} returned ${response.status}, expected ${expectedStatus}: ${body.slice(0, 200)}`
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) await wait(retryDelayMs);
  }

  throw lastError;
}

describe('production API smoke tests', () => {
  jest.setTimeout(attempts * (15000 + retryDelayMs));

  it('serves API metadata from the deployed application', async () => {
    const response = await getWithRetry('/', 200);
    const body = await response.json();

    expect(body).toMatchObject({
      name: 'amormiau-backend',
      status: 'ok',
      docs: '/docs'
    });
  });

  it('connects to the production database', async () => {
    const response = await getWithRetry('/health', 200);

    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      database: 'connected'
    });
  });

  it('serves the Swagger documentation page', async () => {
    const response = await getWithRetry('/docs/', 200);
    const html = await response.text();

    expect(response.headers.get('content-type')).toMatch(/^text\/html/);
    expect(html).toContain('<title>AmorMiau Swagger</title>');
    expect(html).toContain('<div id="swagger-ui"></div>');
  });

  it('serves the Swagger stylesheet with the correct content type', async () => {
    const response = await getWithRetry('/docs/swagger-ui.css', 200);
    const css = await response.text();

    expect(response.headers.get('content-type')).toMatch(/^text\/css/);
    expect(css).toContain('.swagger-ui');
  });

  it('protects private API routes in production', async () => {
    const response = await getWithRetry('/admin/cats', 401);

    await expect(response.json()).resolves.toEqual({
      error: 'You need to be logged in to access this route'
    });
  });

  it('returns 404 for an unknown production route', async () => {
    await getWithRetry('/__production-smoke-not-found__', 404);
  });
});
