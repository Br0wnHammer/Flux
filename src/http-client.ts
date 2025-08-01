import http from 'http';
import https from 'https';
import { URL } from 'url';
import {
  HttpMethod,
  RequestConfig,
  ResponseTimings,
  RawHttpResponse,
  ResponseData,
  HttpResponse,
  DefaultConfig,
  NodeRequestOptions,
  HttpClientError,
  TimeoutError,
  NetworkError,
  MultipartFormData
} from './types.js';

/**
 * Lightweight HTTP Client
 * A simple and flexible HTTP client for making requests with custom configurations
 */
export class HttpClient {
  private baseURL: string;
  private defaultConfig: DefaultConfig;

  constructor(baseURL: string = '', defaultConfig: Partial<DefaultConfig> = {}) {
    this.baseURL = baseURL;
    this.defaultConfig = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js HTTP Client',
        ...defaultConfig.headers,
      },
      timeout: 10000, // 10 seconds
      rawResponse: false,
      contentType: 'json',
      ...defaultConfig,
    };
  }

  /**
   * Merge default config with request-specific config
   * @param config - Request-specific configuration
   * @returns Merged configuration
   */
  private _mergeConfig(config: RequestConfig = {}): RequestConfig {
    // Optimized: Only merge if config has headers
    if (!config.headers) {
      return { ...this.defaultConfig, ...config };
    }
    
    return {
      ...this.defaultConfig,
      ...config,
      headers: {
        ...this.defaultConfig.headers,
        ...config.headers,
      },
    };
  }

  /**
   * Build full URL from base URL and endpoint
   * @param endpoint - API endpoint
   * @returns Full URL
   */
  private _buildURL(endpoint: string): string {
    // Optimized: Fast path for absolute URLs
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Optimized: Fast path for empty base URL
    if (!this.baseURL) {
      return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    }

    const base = this.baseURL.endsWith('/')
      ? this.baseURL.slice(0, -1)
      : this.baseURL;
    const end = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${end}`;
  }

  /**
   * Create and execute a request using Node's http/https module to get timing stats.
   * @param url - Request URL
   * @param config - Request configuration
   * @returns An object with status, headers, body, and timings
   */
  private async _makeRequest(url: string, config: RequestConfig): Promise<RawHttpResponse> {
    return new Promise((resolve, reject) => {
      let urlObj: URL;
      try {
        urlObj = new URL(url);
      } catch (error) {
        return reject(new NetworkError(`Invalid URL: ${url}`));
      }

      const body = config.body || null;

      const options: NodeRequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port ? parseInt(urlObj.port) : (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: (config.method || 'GET') as HttpMethod,
        headers: config.headers || {},
        timeout: config.timeout || this.defaultConfig.timeout,
      };

      const timings: ResponseTimings = {
        start: process.hrtime.bigint(),
        tlsHandshake: null,
        ttfb: null,
        total: null,
      };

      // Choose the appropriate module based on protocol
      const requestModule = urlObj.protocol === 'https:' ? https : http;
      
      let req: http.ClientRequest;
      try {
        req = requestModule.request(options, (res) => {
          const chunks: Buffer[] = [];
          let totalSize = 0;
          const maxSize = 50 * 1024 * 1024; // 50MB limit
          
          res.on('data', (chunk: Buffer) => {
            if (timings.ttfb === null) {
              // First byte received
              timings.ttfb = (process.hrtime.bigint() - timings.start) / 1000000n;
            }
            
            totalSize += chunk.length;
            if (totalSize > maxSize) {
              req.destroy();
              return reject(new NetworkError('Response too large'));
            }
            
            chunks.push(chunk);
          });

          res.on('end', () => {
            timings.total = (process.hrtime.bigint() - timings.start) / 1000000n;
            const responseBody = Buffer.concat(chunks);

            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              return reject(
                new HttpClientError(`HTTP ${res.statusCode}: ${res.statusMessage}`, res.statusCode)
              );
            }

            resolve({
              status: res.statusCode || 0,
              headers: res.headers,
              body: responseBody,
              timings,
            });
          });
        });
      } catch (error) {
        return reject(new NetworkError(`Failed to create request: ${(error as Error).message}`));
      }

      req.on('socket', (socket) => {
        // Only track TLS handshake for HTTPS requests
        if (urlObj.protocol === 'https:') {
          socket.on('secureConnect', () => {
            timings.tlsHandshake =
              (process.hrtime.bigint() - timings.start) / 1000000n;
          });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new TimeoutError(config.timeout || this.defaultConfig.timeout));
      });

      req.on('error', (error: Error) => {
        // Enhanced error handling with more specific error types
        if (error.message.includes('ENOTFOUND')) {
          reject(new NetworkError(`DNS lookup failed: ${urlObj.hostname}`));
        } else if (error.message.includes('ECONNREFUSED')) {
          reject(new NetworkError(`Connection refused: ${urlObj.hostname}:${options.port}`));
        } else if (error.message.includes('ECONNRESET')) {
          reject(new NetworkError('Connection reset by peer'));
        } else if (error.message.includes('ETIMEDOUT')) {
          reject(new TimeoutError(config.timeout || this.defaultConfig.timeout));
        } else if (error.message.includes('CERT_HAS_EXPIRED') || error.message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
          reject(new NetworkError('SSL/TLS certificate error'));
        } else if (error.message.includes('HPE_INVALID_HEADER_TOKEN')) {
          reject(new NetworkError('Invalid HTTP response headers'));
        } else {
          reject(new NetworkError(error.message));
        }
      });

      if (body) {
        try {
          req.write(body);
        } catch (error) {
          req.destroy();
          reject(new NetworkError(`Failed to write request body: ${(error as Error).message}`));
        }
      }

      req.end();
    });
  }

  /**
   * Parse response based on content type
   * @param response - The response object from _makeRequest
   * @returns Parsed response data
   */
  private async _parseResponse(response: RawHttpResponse): Promise<ResponseData> {
    const contentType = response.headers['content-type'] || response.headers['Content-Type'];
    const bodyBuffer = response.body;

    if (!bodyBuffer || bodyBuffer.length === 0) {
      return '';
    }

    // If no content type or empty content type, return as string
    if (!contentType) {
      return bodyBuffer.toString();
    }

    try {
      // Use content type for parsing
      if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) {
        const jsonString = bodyBuffer.toString();
        return jsonString.trim() ? JSON.parse(jsonString) : {};
      }

      if (contentType && typeof contentType === 'string' && contentType.includes('text/')) {
        return bodyBuffer.toString();
      }

      // For binary data like images or PDFs, return the buffer itself
      if (contentType && typeof contentType === 'string' && 
          (contentType.includes('application/octet-stream') || 
           contentType.includes('application/pdf') ||
           contentType.includes('image/'))) {
        return bodyBuffer;
      }

      // For XML and other text-based formats
      if (contentType && typeof contentType === 'string' && 
          (contentType.includes('application/xml') || 
           contentType.includes('text/xml') ||
           contentType.includes('application/xhtml+xml'))) {
        return bodyBuffer.toString();
      }

      // Default to string for unknown content types
      return bodyBuffer.toString();
    } catch (error) {
      // If JSON parsing fails, return the raw string
      if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) {
        return bodyBuffer.toString();
      }
      throw new NetworkError(`Failed to parse response: ${(error as Error).message}`);
    }
  }

  /**
   * Convert data to URL-encoded form string
   * @param data - Form data object
   * @returns URL-encoded string
   */
  private _serializeFormData(data: Record<string, any>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }

  /**
   * Convert data to multipart form data
   * @param data - Multipart form data object
   * @returns Buffer with multipart boundary
   */
  private _serializeMultipartData(data: MultipartFormData): { body: Buffer; boundary: string } {
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    const parts: Buffer[] = [];

    for (const [key, value] of Object.entries(data)) {
      parts.push(Buffer.from(`--${boundary}\r\n`));
      
      if (typeof value === 'string') {
        parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
        parts.push(Buffer.from(value));
        parts.push(Buffer.from('\r\n'));
      } else if (Buffer.isBuffer(value)) {
        parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
        parts.push(value);
        parts.push(Buffer.from('\r\n'));
      } else if (typeof value === 'object' && value.filename && value.content) {
        const contentType = value.contentType || 'application/octet-stream';
        parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"; filename="${value.filename}"\r\n`));
        parts.push(Buffer.from(`Content-Type: ${contentType}\r\n\r\n`));
        parts.push(value.content);
        parts.push(Buffer.from('\r\n'));
      }
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`));
    return { body: Buffer.concat(parts), boundary };
  }

  /**
   * Serialize request data based on content type
   * @param data - Request data
   * @param contentType - Content type
   * @returns Serialized data and headers
   */
  private _serializeData(data: any, contentType: string): { body: Buffer | string | null; headers: Record<string, string> } {
    if (data === null || data === undefined) {
      return { body: null, headers: {} };
    }

    switch (contentType) {
      case 'json':
        return {
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'form':
        return {
          body: this._serializeFormData(data),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

      case 'multipart':
        const { body, boundary } = this._serializeMultipartData(data);
        return {
          body,
          headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
        };

      case 'text':
        return {
          body: String(data),
          headers: { 'Content-Type': 'text/plain' }
        };

      case 'binary':
        if (Buffer.isBuffer(data)) {
          return {
            body: data,
            headers: { 'Content-Type': 'application/octet-stream' }
          };
        }
        throw new NetworkError('Binary content type requires Buffer data');

      default:
        return {
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        };
    }
  }

  /**
   * Generic request method to be called by get, post, etc.
   * @param endpoint - API endpoint
   * @param config - Request configuration
   * @param data - Request data (optional)
   * @returns Response with data, timings, statusCode, and headers
   */
  private async _request<T = ResponseData>(
    endpoint: string, 
    config: RequestConfig, 
    data?: any
  ): Promise<HttpResponse<T>> {
    // Validate endpoint
    if (!endpoint || typeof endpoint !== 'string') {
      throw new NetworkError('Invalid endpoint: must be a non-empty string');
    }

    // Validate data for POST/PUT requests
    if (data !== null && data !== undefined && (config.method === 'POST' || config.method === 'PUT')) {
      if (typeof data === 'object' && !Buffer.isBuffer(data) && config.contentType === 'json') {
        try {
          // Test if data can be stringified
          JSON.stringify(data);
        } catch (error) {
          throw new NetworkError('Invalid request data: cannot be serialized to JSON');
        }
      }
    }

    const mergedConfig = this._mergeConfig(config);
    const contentType = mergedConfig.contentType || this.defaultConfig.contentType || 'json';
    
    // Serialize data based on content type
    const { body, headers: contentTypeHeaders } = this._serializeData(data, contentType);
    
    const finalConfig = {
      ...mergedConfig,
      body,
      headers: {
        ...mergedConfig.headers,
        ...contentTypeHeaders,
      },
    };

    const url = this._buildURL(endpoint);
    const response = await this._makeRequest(url, finalConfig);
    
    if (mergedConfig.rawResponse) {
      return {
        data: response as unknown as T,
        timings: response.timings,
        statusCode: response.status,
        headers: response.headers,
      };
    }

    const parsedData = await this._parseResponse(response);
    
    return {
      data: parsedData as T,
      timings: response.timings,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  /**
   * Make a GET request
   * @param endpoint - API endpoint
   * @param config - Request configuration
   * @returns Response data
   */
  async get<T = ResponseData>(endpoint: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Make a POST request
   * @param endpoint - API endpoint
   * @param data - Request payload
   * @param config - Request configuration
   * @returns Response data
   */
  async post<T = ResponseData>(
    endpoint: string, 
    data: any = null, 
    config: RequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'POST' }, data);
  }

  /**
   * Make a PUT request
   * @param endpoint - API endpoint
   * @param data - Request payload
   * @param config - Request configuration
   * @returns Response data
   */
  async put<T = ResponseData>(
    endpoint: string, 
    data: any = null, 
    config: RequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'PUT' }, data);
  }

  /**
   * Make a DELETE request
   * @param endpoint - API endpoint
   * @param config - Request configuration
   * @returns Response data
   */
  async delete<T = ResponseData>(endpoint: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Make a POST request with form data
   * @param endpoint - API endpoint
   * @param formData - Form data object
   * @param config - Request configuration
   * @returns Response data
   */
  async postForm<T = ResponseData>(
    endpoint: string, 
    formData: Record<string, any>, 
    config: RequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'POST', contentType: 'form' }, formData);
  }

  /**
   * Make a POST request with multipart form data
   * @param endpoint - API endpoint
   * @param multipartData - Multipart form data object
   * @param config - Request configuration
   * @returns Response data
   */
  async postMultipart<T = ResponseData>(
    endpoint: string, 
    multipartData: MultipartFormData, 
    config: RequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'POST', contentType: 'multipart' }, multipartData);
  }

  /**
   * Make a POST request with text data
   * @param endpoint - API endpoint
   * @param textData - Text data
   * @param config - Request configuration
   * @returns Response data
   */
  async postText<T = ResponseData>(
    endpoint: string, 
    textData: string, 
    config: RequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'POST', contentType: 'text' }, textData);
  }

  /**
   * Make a POST request with binary data
   * @param endpoint - API endpoint
   * @param binaryData - Binary data buffer
   * @param config - Request configuration
   * @returns Response data
   */
  async postBinary<T = ResponseData>(
    endpoint: string, 
    binaryData: Buffer, 
    config: RequestConfig = {}
  ): Promise<HttpResponse<T>> {
    return this._request<T>(endpoint, { ...config, method: 'POST', contentType: 'binary' }, binaryData);
  }

  /**
   * Set default headers for all requests
   * @param headers - Headers to set
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultConfig.headers = {
      ...this.defaultConfig.headers,
      ...headers,
    };
  }

  /**
   * Set authentication token
   * @param token - Authentication token
   * @param type - Token type (default: 'Bearer')
   */
  setAuthToken(token: string, type: string = 'Bearer'): void {
    this.setDefaultHeaders({
      Authorization: `${type} ${token}`,
    });
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    const headers = { ...this.defaultConfig.headers };
    delete headers.Authorization;
    this.defaultConfig.headers = headers;
  }

  /**
   * Get current default configuration
   * @returns Current default configuration
   */
  getDefaultConfig(): DefaultConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Get current base URL
   * @returns Current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Set base URL
   * @param baseURL - New base URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * Create a new HttpClient instance with the same configuration
   * @returns New HttpClient instance
   */
  clone(): HttpClient {
    return new HttpClient(this.baseURL, this.defaultConfig);
  }

  /**
   * Check if the client is configured for HTTPS
   * @returns True if base URL uses HTTPS
   */
  isHttps(): boolean {
    return this.baseURL.startsWith('https://');
  }

  /**
   * Get the hostname from the base URL
   * @returns Hostname or empty string
   */
  getHostname(): string {
    try {
      const url = new URL(this.baseURL || 'http://localhost');
      return url.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Get the port from the base URL
   * @returns Port number or null
   */
  getPort(): number | null {
    try {
      const url = new URL(this.baseURL || 'http://localhost');
      return url.port ? parseInt(url.port) : null;
    } catch {
      return null;
    }
  }

  /**
   * Reset the client to default configuration
   */
  reset(): void {
    this.defaultConfig = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js HTTP Client',
      },
      timeout: 10000,
    };
  }

  /**
   * Set request timeout
   * @param timeout - Timeout in milliseconds
   */
  setTimeout(timeout: number): void {
    this.defaultConfig.timeout = timeout;
  }

  /**
   * Get current timeout value
   * @returns Current timeout in milliseconds
   */
  getTimeout(): number {
    return this.defaultConfig.timeout;
  }

  /**
   * Check if the client has a base URL configured
   * @returns True if base URL is set
   */
  hasBaseURL(): boolean {
    return this.baseURL.length > 0;
  }

  /**
   * Get the protocol from the base URL
   * @returns Protocol (http, https) or empty string
   */
  getProtocol(): string {
    try {
      const url = new URL(this.baseURL || 'http://localhost');
      return url.protocol.replace(':', '');
    } catch {
      return '';
    }
  }

  /**
   * Set a specific header
   * @param key - Header key
   * @param value - Header value
   */
  setHeader(key: string, value: string): void {
    this.defaultConfig.headers[key] = value;
  }

  /**
   * Remove a specific header
   * @param key - Header key to remove
   */
  removeHeader(key: string): void {
    delete this.defaultConfig.headers[key];
  }

  /**
   * Get a specific header value
   * @param key - Header key
   * @returns Header value or undefined
   */
  getHeader(key: string): string | undefined {
    return this.defaultConfig.headers[key];
  }

  /**
   * Check if a header exists
   * @param key - Header key
   * @returns True if header exists
   */
  hasHeader(key: string): boolean {
    return key in this.defaultConfig.headers;
  }

  /**
   * Get all current headers
   * @returns Copy of current headers
   */
  getHeaders(): Record<string, string> {
    return { ...this.defaultConfig.headers };
  }

  /**
   * Clear all headers
   */
  clearHeaders(): void {
    this.defaultConfig.headers = {};
  }

  /**
   * Set multiple headers at once
   * @param headers - Headers to set
   */
  setHeaders(headers: Record<string, string>): void {
    this.defaultConfig.headers = {
      ...this.defaultConfig.headers,
      ...headers,
    };
  }
}

export default HttpClient; 