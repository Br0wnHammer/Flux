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
  NetworkError
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
      ...defaultConfig,
    };
  }

  /**
   * Merge default config with request-specific config
   * @param config - Request-specific configuration
   * @returns Merged configuration
   */
  private _mergeConfig(config: RequestConfig = {}): RequestConfig {
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
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const base = this.baseURL.endsWith('/')
      ? this.baseURL.slice(0, -1)
      : this.baseURL;
    const end = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${end}`;
  }

  /**
   * Create and execute a request using Node's https module to get timing stats.
   * @param url - Request URL
   * @param config - Request configuration
   * @returns An object with status, headers, body, and timings
   */
  private async _makeRequest(url: string, config: RequestConfig): Promise<RawHttpResponse> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
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

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        
        res.on('data', (chunk: Buffer) => {
          if (timings.ttfb === null) {
            // First byte received
            timings.ttfb = (process.hrtime.bigint() - timings.start) / 1000000n;
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

      req.on('socket', (socket) => {
        socket.on('secureConnect', () => {
          timings.tlsHandshake =
            (process.hrtime.bigint() - timings.start) / 1000000n;
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new TimeoutError(config.timeout || this.defaultConfig.timeout));
      });

      req.on('error', (error: Error) => {
        reject(new NetworkError(error.message));
      });

      if (body) {
        req.write(body);
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

    if (!contentType || !bodyBuffer || bodyBuffer.length === 0) {
      return bodyBuffer.toString();
    }

    if (contentType.includes('application/json')) {
      return JSON.parse(bodyBuffer.toString());
    }

    if (contentType.includes('text/')) {
      return bodyBuffer.toString();
    }

    // For binary data like images or PDFs, return the buffer itself
    if (contentType.includes('application/octet-stream') || 
        contentType.includes('application/pdf') ||
        contentType.includes('image/')) {
      return bodyBuffer;
    }

    return bodyBuffer.toString();
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
    const mergedConfig = this._mergeConfig({
      ...config,
      body: data ? JSON.stringify(data) : null as any,
    });

    const url = this._buildURL(endpoint);
    const response = await this._makeRequest(url, mergedConfig);
    
    if (config.rawResponse) {
      return response as unknown as HttpResponse<T>;
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
}

export default HttpClient; 