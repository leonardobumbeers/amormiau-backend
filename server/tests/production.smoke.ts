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

interface RequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

async function request(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      'user-agent': 'amormiau-production-smoke-test',
      ...(options.headers || {})
    },
    timeout: 15000
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
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

  it('completes the production signup, login, profile and account cleanup flow', async () => {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const credentials = {
      name: 'Production Smoke Test',
      email: `production-smoke-${unique}@example.com`,
      password: `Smoke-${unique}`,
      cpf: `smoke-cpf-${unique}`,
      rg: `smoke-rg-${unique}`
    };
    let userId;
    let accessToken;

    try {
      const signup = await request('/signup', {
        method: 'POST', body: JSON.stringify(credentials)
      });
      expect(signup.response.status).toBe(200);
      expect(signup.body.message).toBe('You have signed up successfully');
      expect(signup.body.data).not.toHaveProperty('password');
      expect(signup.body.data).not.toHaveProperty('accessToken');
      userId = signup.body.data._id;

      const login = await request('/login', {
        method: 'POST', body: JSON.stringify({ email: credentials.email, password: credentials.password })
      });
      expect(login.response.status).toBe(200);
      expect(login.body.data).toMatchObject({ email: credentials.email, role: 'basic' });
      expect(login.body.accessToken).toEqual(expect.any(String));
      accessToken = login.body.accessToken;

      const profile = await request(`/user/${userId}`, {
        headers: { 'x-access-token': accessToken }
      });
      expect(profile.response.status).toBe(200);
      expect(profile.body.data).toMatchObject({ _id: userId, email: credentials.email });
      expect(profile.body.data).not.toHaveProperty('password');
      expect(profile.body.data).not.toHaveProperty('accessToken');
    } finally {
      if (userId && accessToken) {
        const cleanup = await request(`/user/${userId}`, {
          method: 'DELETE', headers: { 'x-access-token': accessToken }
        });
        expect(cleanup.response.status).toBe(200);
      }
    }
  });

  it('returns 404 for an unknown production route', async () => {
    await getWithRetry('/__production-smoke-not-found__', 404);
  });
});
