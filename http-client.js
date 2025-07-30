import https from "https";
import { URL } from "url";

/**
 * Lightweight HTTP Client
 * A simple and flexible HTTP client for making requests with custom configurations
 */
class HttpClient {
  constructor(baseURL = "", defaultConfig = {}) {
    this.baseURL = baseURL;
    this.defaultConfig = {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Node.js HTTP Client",
        ...defaultConfig.headers,
      },
      timeout: 10000, // 10 seconds
      ...defaultConfig,
    };
  }

  /**
   * Merge default config with request-specific config
   * @param {Object} config - Request-specific configuration
   * @returns {Object} Merged configuration
   */
  _mergeConfig(config = {}) {
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
   * @param {string} endpoint - API endpoint
   * @returns {string} Full URL
   */
  _buildURL(endpoint) {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }

    const base = this.baseURL.endsWith("/")
      ? this.baseURL.slice(0, -1)
      : this.baseURL;
    const end = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${base}${end}`;
  }

  /**
   * Create and execute a request using Node's https module to get timing stats.
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} An object with status, headers, body, and timings
   */
  async _makeRequest(url, config) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const body = config.body || null;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: config.method || "GET",
        headers: config.headers,
        timeout: config.timeout,
      };

      const timings = {
        start: process.hrtime.bigint(),
        tlsHandshake: null,
        ttfb: null,
        total: null,
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        
        res.on("data", (chunk) => {
          if (timings.ttfb === null) {
            // First byte received
            timings.ttfb = (process.hrtime.bigint() - timings.start) / 1000000n;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          timings.total = (process.hrtime.bigint() - timings.start) / 1000000n;
          const responseBody = Buffer.concat(chunks);

          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(
              new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`)
            );
          }

          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseBody,
            timings,
          });
        });
      });

      req.on("socket", (socket) => {
        socket.on("secureConnect", () => {
          timings.tlsHandshake =
            (process.hrtime.bigint() - timings.start) / 1000000n;
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Request timeout after ${config.timeout}ms`));
      });

      req.on("error", (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Request configuration
   * @returns {Promise} Response data
   */
  async get(endpoint, config = {}) {
    return this._request(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request payload
   * @param {Object} config - Request configuration
   * @returns {Promise} Response data
   */
  async post(endpoint, data = null, config = {}) {
    return this._request(endpoint, { ...config, method: 'POST', body: data });
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {*} data - Request payload
   * @param {Object} config - Request configuration
   * @returns {Promise} Response data
   */
  async put(endpoint, data = null, config = {}) {
    return this._request(endpoint, { ...config, method: 'PUT', body: data });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Request configuration
   * @returns {Promise} Response data
   */
  async delete(endpoint, config = {}) {
    return this._request(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Parse response based on content type
   * @param {Object} response - The response object from _makeRequest
   * @returns {Promise<any>} Parsed response data
   */
  async _parseResponse(response) {
    // Node.js headers are objects, not Headers class
    const contentType = response.headers["content-type"] || response.headers["Content-Type"];
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
   * @param {string} endpoint 
   * @param {Object} config 
   * @param {*} [data=null] 
   * @returns {Promise<Object>} { data, timings, statusCode, headers }
   */
    async _request(endpoint, config, data = null) {
      const mergedConfig = this._mergeConfig({
        ...config,
        body: data ? JSON.stringify(data) : undefined,
      });
  
      const url = this._buildURL(endpoint);
      const response = await this._makeRequest(url, mergedConfig);
      
      if (config.rawResponse) {
        return response;
      }
  
      const parsedData = await this._parseResponse(response);
      
      return {
        data: parsedData,
        timings: response.timings,
        statusCode: response.statusCode,
        headers: response.headers,
      };
    }
  

  /**
   * Set default headers for all requests
   * @param {Object} headers - Headers to set
   */
  setDefaultHeaders(headers) {
    this.defaultConfig.headers = {
      ...this.defaultConfig.headers,
      ...headers,
    };
  }

  /**
   * Set authentication token
   * @param {string} token - Authentication token
   * @param {string} type - Token type (default: 'Bearer')
   */
  setAuthToken(token, type = "Bearer") {
    this.setDefaultHeaders({
      Authorization: `${type} ${token}`,
    });
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    const headers = { ...this.defaultConfig.headers };
    delete headers.Authorization;
    this.defaultConfig.headers = headers;
  }
}

export default HttpClient;
