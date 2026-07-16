import type { Response } from 'express';

export type MockResponse = Response & {
  status: jest.MockedFunction<Response['status']>;
  json: jest.MockedFunction<Response['json']>;
};

export function createMockResponse(): MockResponse {
  const response = {
    locals: {},
    status: jest.fn(),
    json: jest.fn()
  } as unknown as MockResponse;

  response.status.mockImplementation(() => response);
  response.json.mockImplementation(() => response);
  return response;
}
