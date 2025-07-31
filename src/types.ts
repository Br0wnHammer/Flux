import { IncomingHttpHeaders } from 'http';

/**
 * HTTP Methods supported by the client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Request configuration interface
 */
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  timeout?: number;
  body?: string | Buffer;
  rawResponse?: boolean;
}

/**
 * Response timing information
 */
export interface ResponseTimings {
  start: bigint;
  tlsHandshake: bigint | null;
  ttfb: bigint | null; // Time to first byte
  total: bigint | null;
}

/**
 * Raw HTTP response from Node.js
 */
export interface RawHttpResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
  timings: ResponseTimings;
}

/**
 * Parsed response data
 */
export type ResponseData = string | Buffer | Record<string, any> | any[];

/**
 * Final response object returned to the user
 */
export interface HttpResponse<T = ResponseData> {
  data: T;
  timings: ResponseTimings;
  statusCode: number;
  headers: IncomingHttpHeaders;
}

/**
 * Default configuration for the HTTP client
 */
export interface DefaultConfig {
  headers: Record<string, string>;
  timeout: number;
}

/**
 * Constructor options for HttpClient
 */
export interface HttpClientOptions {
  baseURL?: string;
  defaultConfig?: Partial<DefaultConfig>;
}

/**
 * Authentication token configuration
 */
export interface AuthTokenConfig {
  token: string;
  type?: string;
}

/**
 * URL building options
 */
export interface URLBuildOptions {
  baseURL: string;
  endpoint: string;
}

/**
 * Request options for Node.js http/https modules
 */
export interface NodeRequestOptions {
  hostname: string;
  port: number;
  path: string;
  method: HttpMethod;
  headers: Record<string, string>;
  timeout: number;
}

/**
 * Content type mapping for response parsing
 */
export type ContentType = 
  | 'application/json'
  | 'text/plain'
  | 'text/html'
  | 'application/octet-stream'
  | 'application/pdf'
  | 'image/*'
  | string;

/**
 * Error types for the HTTP client
 */
export class HttpClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: HttpResponse
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

export class TimeoutError extends HttpClientError {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends HttpClientError {
  constructor(message: string) {
    super(`Network error: ${message}`);
    this.name = 'NetworkError';
  }
} 