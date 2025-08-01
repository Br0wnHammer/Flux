/**
 * Lightweight HTTP Client for TypeScript
 * 
 * A simple, flexible, and type-safe HTTP client for making requests with custom configurations
 */

export { HttpClient } from './http-client.js';
export type { 
  HttpMethod, 
  RequestConfig, 
  ResponseTimings, 
  RawHttpResponse, 
  HttpResponse, 
  ResponseData, 
  DefaultConfig, 
  HttpClientOptions, 
  AuthTokenConfig, 
  URLBuildOptions, 
  NodeRequestOptions, 
  ContentType,
  FormData,
  MultipartFormData
} from './types.js';

export { HttpClientError, TimeoutError, NetworkError, ValidationError } from './types.js';

// Default export
export { default } from './http-client.js'; 