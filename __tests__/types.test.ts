import { HttpClientError, TimeoutError, NetworkError, ValidationError, HttpResponse, ResponseTimings } from '../src/index.js';

describe('Error Classes', () => {
  describe('HttpClientError', () => {
    it('should create HttpClientError with message', () => {
      const error = new HttpClientError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('HttpClientError');
      expect(error.statusCode).toBeUndefined();
      expect(error.response).toBeUndefined();
    });

    it('should create HttpClientError with status code', () => {
      const error = new HttpClientError('Test error', 404);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
    });

    it('should create HttpClientError with response', () => {
      const mockResponse: HttpResponse = {
        data: { error: 'Not found' },
        statusCode: 404,
        headers: {},
        timings: {
          start: BigInt(0),
          tlsHandshake: null,
          ttfb: null,
          total: null
        }
      };
      const error = new HttpClientError('Test error', 404, mockResponse);
      expect(error.response).toBe(mockResponse);
    });

    it('should be instanceof Error', () => {
      const error = new HttpClientError('Test error');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('TimeoutError', () => {
    it('should create TimeoutError with timeout value', () => {
      const error = new TimeoutError(5000);
      expect(error.message).toBe('Request timeout after 5000ms');
      expect(error.name).toBe('TimeoutError');
    });

    it('should be instanceof HttpClientError', () => {
      const error = new TimeoutError(5000);
      expect(error).toBeInstanceOf(HttpClientError);
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with message', () => {
      const error = new NetworkError('Connection failed');
      expect(error.message).toBe('Network error: Connection failed');
      expect(error.name).toBe('NetworkError');
    });

    it('should be instanceof HttpClientError', () => {
      const error = new NetworkError('Connection failed');
      expect(error).toBeInstanceOf(HttpClientError);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with message', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Validation error: Invalid input');
      expect(error.name).toBe('ValidationError');
    });

    it('should be instanceof HttpClientError', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(HttpClientError);
    });
  });
});

describe('Type Definitions', () => {
  it('should have correct ResponseTimings structure', () => {
    const timings: ResponseTimings = {
      start: BigInt(0),
      tlsHandshake: null,
      ttfb: null,
      total: null
    };

    expect(typeof timings.start).toBe('bigint');
    expect(timings.tlsHandshake).toBeNull();
    expect(timings.ttfb).toBeNull();
    expect(timings.total).toBeNull();
  });

  it('should have correct HttpResponse structure', () => {
    const response: HttpResponse = {
      data: { test: 'data' },
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      timings: {
        start: BigInt(0),
        tlsHandshake: null,
        ttfb: BigInt(100),
        total: BigInt(500)
      }
    };

    expect(response.data).toEqual({ test: 'data' });
    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('content-type');
    expect(response.timings).toBeDefined();
  });
}); 