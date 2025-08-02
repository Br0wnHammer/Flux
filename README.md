![](https://img.shields.io/npm/v/flux-http.svg?style=flat)
![](https://img.shields.io/github/license/Br0wnHammer/Flux.svg?style=flat)
![](https://img.shields.io/github/repo-size/Br0wnHammer/Flux.svg?style=flat)
![](https://img.shields.io/github/last-commit/Br0wnHammer/Flux.svg?style=flat)
![](https://img.shields.io/npm/d18m/flux-http)
![](https://img.shields.io/github/languages/top/Br0wnHammer/Flux.svg?style=flat)
![](https://img.shields.io/codecov/c/github/Br0wnHammer/Flux/develop?style=flat)

# Flux

A lightweight, flexible, and type-safe HTTP client for Node.js with comprehensive timing metrics and full TypeScript support.

**GitHub:** [https://github.com/Br0wnHammer/Flux](https://github.com/Br0wnHammer/Flux)

### Contributors

- **[Ankit Sharma](https://github.com/beingmartinbmc)**

## Features

- **Type-Safe**: Full TypeScript support with generic response types
- **Performance Metrics**: Detailed timing information (TLS handshake, TTFB, total time)
- **Flexible Configuration**: Custom headers, timeouts, and request options
- **Authentication Support**: Built-in token management
- **Error Handling**: Comprehensive error types and handling
- **Lightweight**: Minimal dependencies, built on Node.js native modules
- **ES Module Support**: Modern ES module architecture
- **Content Type Detection**: Automatic response parsing based on content type
- **Base URL Support**: Convenient base URL configuration
- **Request/Response Interceptors**: Custom request and response processing

## Installation

```bash
npm install flux-http
```

## TypeScript Support

The package includes full TypeScript support with comprehensive type definitions. You can import types for better intellisense:

```typescript
import { HttpClient, HttpResponse, RequestConfig, HttpClientError } from "flux-http";

// Type-safe API responses
interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

const client = new HttpClient('https://api.example.com');
const response: HttpResponse<User> = await client.get<User>('/users/1');
```

## Quick Start

```typescript
import { HttpClient } from "flux-http";

// Create a new HTTP client
const client = new HttpClient('https://api.example.com');

// Make a GET request
const response = await client.get('/users/1');
console.log('User data:', response.data);
console.log('Response time:', response.timings.total + 'ms');

// Make a POST request
const newUser = { name: 'John Doe', email: 'john@example.com' };
const createResponse = await client.post('/users', newUser);
console.log('Created user:', createResponse.data);

// Set authentication
client.setAuthToken('your-auth-token');
```

## API Reference

### HttpClient Class

The main HTTP client class that handles all HTTP requests.

#### Constructor

```typescript
new HttpClient(baseURL?: string, defaultConfig?: Partial<DefaultConfig>)
```

**Parameters:**

- `baseURL` (optional): Base URL for all requests. Default: empty string
- `defaultConfig` (optional): Default configuration for all requests

**Example:**

```typescript
const client = new HttpClient('https://api.example.com', {
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0'
  },
  timeout: 10000
});
```

#### Methods

##### `get<T>(endpoint: string, config?: RequestConfig): Promise<HttpResponse<T>>`

Makes a GET request to the specified endpoint.

**Parameters:**

- `endpoint`: API endpoint (relative to base URL)
- `config` (optional): Request-specific configuration

**Returns:** `Promise<HttpResponse<T>>` - Response with data, timings, and metadata

**Example:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const response: HttpResponse<User> = await client.get<User>('/users/1');
console.log('User:', response.data);
console.log('Time to first byte:', response.timings.ttfb + 'ms');
console.log('Total time:', response.timings.total + 'ms');
```

##### `post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>`

Makes a POST request to the specified endpoint.

**Parameters:**

- `endpoint`: API endpoint (relative to base URL)
- `data` (optional): Request payload
- `config` (optional): Request-specific configuration

**Returns:** `Promise<HttpResponse<T>>` - Response with data, timings, and metadata

**Example:**

```typescript
const newUser = { name: 'Jane Doe', email: 'jane@example.com' };
const response: HttpResponse<User> = await client.post<User>('/users', newUser);
console.log('Created user:', response.data);
```

##### `put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>`

Makes a PUT request to the specified endpoint.

**Parameters:**

- `endpoint`: API endpoint (relative to base URL)
- `data` (optional): Request payload
- `config` (optional): Request-specific configuration

**Returns:** `Promise<HttpResponse<T>>` - Response with data, timings, and metadata

**Example:**

```typescript
// GET request
const response = await client.get<ResponseType>(endpoint, config?);

// POST request
const response = await client.post<ResponseType>(endpoint, data?, config?);

// PUT request
const response = await client.put<ResponseType>(endpoint, data?, config?);

// DELETE request
const response = await client.delete<ResponseType>(endpoint, config?);
```

### Type Definitions

#### RequestConfig
```typescript
interface RequestConfig {
  method?: HttpMethod;           // HTTP method (GET, POST, PUT, DELETE)
  headers?: Record<string, string>; // Request headers
  timeout?: number;              // Request timeout in milliseconds
  body?: string | Buffer;        // Request body
  rawResponse?: boolean;         // Return raw response without parsing
}
```

#### HttpResponse
```typescript
interface HttpResponse<T = ResponseData> {
  data: T;                       // Parsed response data
  timings: ResponseTimings;      // Timing information
  statusCode: number;            // HTTP status code
  headers: IncomingHttpHeaders;  // Response headers
}
```

#### ResponseTimings

```typescript
interface ResponseTimings {
  start: bigint;                 // Request start time
  tlsHandshake: bigint | null;   // TLS handshake duration (HTTPS only)
  ttfb: bigint | null;           // Time to first byte
  total: bigint | null;          // Total request duration
}
```

### Configuration

#### Setting Default Headers
```typescript
client.setDefaultHeaders({
  'Authorization': 'Bearer token',
  'X-Custom-Header': 'value'
});
```

#### Setting Authentication Token
```typescript
client.setAuthToken('your-token-here');
client.setAuthToken('your-token-here', 'Custom'); // Custom token type
```

#### Clearing Authentication
```typescript
client.clearAuthToken();
```


### Performance Monitoring

Monitor request performance with detailed timing metrics:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
}

class UserApiClient {
  private client: HttpClient;

  constructor(baseURL: string) {
    this.client = new HttpClient(baseURL);
  }

  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.client.post<User>('/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }
}

### Custom Request Configuration

Configure requests with custom headers, timeouts, and options:

```typescript
const client = new HttpClient('https://api.example.com');

// Custom configuration for a specific request
const customConfig: RequestConfig = {
  headers: {
    'X-Custom-Header': 'custom-value',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  },
  timeout: 5000, // 5 seconds
};

const response = await client.get('/users', customConfig);
```

### Authentication Examples

Different authentication patterns:

```typescript
const client = new HttpClient('https://api.example.com');

// Bearer token authentication
client.setAuthToken('your-jwt-token');

// API key authentication
client.setAuthToken('your-api-key', 'ApiKey');

// Custom authorization header
client.setDefaultHeaders({
  'Authorization': 'Custom your-custom-token'
});

// Clear authentication
client.clearAuthToken();
```

### Content Type Support

Flux HTTP client provides comprehensive support for different content types with automatic parsing and serialization. The client can handle various data formats for both requests and responses.

#### Supported Content Types

##### 1. JSON (Default)
**Content-Type:** `application/json`

**Request Usage:**
```typescript
// Automatic JSON serialization (default)
const userData = { name: 'John Doe', email: 'john@example.com' };
const response = await client.post('/users', userData);

// Explicit JSON content type
const response = await client.post('/users', userData, {
  contentType: 'json'
});
```

**Response Parsing:** Automatically parses JSON responses into JavaScript objects.

##### 2. Form Data
**Content-Type:** `application/x-www-form-urlencoded`

**Request Usage:**
```typescript
// Using postForm method (recommended)
const formData = {
  username: 'johndoe',
  password: 'secret123',
  remember: 'true'
};
const response = await client.postForm('/login', formData);

// Using contentType option
const response = await client.post('/login', formData, {
  contentType: 'form'
});
```

**Response Parsing:** Returns URL-encoded string data.

##### 3. Multipart Form Data
**Content-Type:** `multipart/form-data`

**Request Usage:**
```typescript
import { MultipartFormData } from 'flux-http';

// File upload with multipart data
const multipartData: MultipartFormData = {
  username: 'johndoe',
  avatar: {
    filename: 'avatar.jpg',
    content: Buffer.from('file content'),
    contentType: 'image/jpeg'
  },
  bio: 'Software developer'
};

const response = await client.postMultipart('/upload', multipartData);

// Using contentType option
const response = await client.post('/upload', multipartData, {
  contentType: 'multipart'
});
```

**MultipartFormData Interface:**
```typescript
interface MultipartFormData {
  [key: string]: string | Buffer | {
    filename: string;
    content: Buffer;
    contentType?: string;
  };
}
```

##### 4. Plain Text
**Content-Type:** `text/plain`

**Request Usage:**
```typescript
// Using postText method (recommended)
const textData = 'Hello, World!';
const response = await client.postText('/message', textData);

// Using contentType option
const response = await client.post('/message', textData, {
  contentType: 'text'
});
```

**Response Parsing:** Returns plain text as string.

##### 5. Binary Data
**Content-Type:** `application/octet-stream`

**Request Usage:**
```typescript
// Using postBinary method (recommended)
const binaryData = Buffer.from('binary content');
const response = await client.postBinary('/upload', binaryData);

// Using contentType option
const response = await client.post('/upload', binaryData, {
  contentType: 'binary'
});
```

**Response Parsing:** Returns Buffer for binary responses.

#### Response Content Type Detection

The client automatically detects and parses responses based on the `Content-Type` header:

```typescript
// JSON responses (application/json)
const jsonResponse = await client.get('/api/users');
console.log(typeof jsonResponse.data); // 'object'

// Text responses (text/*)
const textResponse = await client.get('/api/status');
console.log(typeof textResponse.data); // 'string'

// Binary responses (application/octet-stream, image/*, application/pdf)
const binaryResponse = await client.get('/api/file');
console.log(Buffer.isBuffer(binaryResponse.data)); // true

// XML responses (application/xml, text/xml)
const xmlResponse = await client.get('/api/data');
console.log(typeof xmlResponse.data); // 'string'
```

#### Custom Content Type Configuration

You can set custom content types for specific requests:

```typescript
// Custom JSON content type
const response = await client.post('/api/data', data, {
  headers: {
    'Content-Type': 'application/vnd.api+json'
  }
});

// Custom XML content type
const response = await client.post('/api/data', xmlData, {
  headers: {
    'Content-Type': 'application/soap+xml'
  }
});
```

#### Content Type Examples

**File Upload with Metadata:**
```typescript
const fileData: MultipartFormData = {
  file: {
    filename: 'document.pdf',
    content: fs.readFileSync('document.pdf'),
    contentType: 'application/pdf'
  },
  title: 'Important Document',
  description: 'Uploaded via Flux HTTP client'
};

const response = await client.postMultipart('/documents', fileData);
```

**API with Different Content Types:**
```typescript
// JSON API
const user = await client.post('/users', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});

// Form submission
const login = await client.postForm('/auth/login', {
  username: 'janedoe',
  password: 'password123'
});

// File upload
const upload = await client.postBinary('/files', fileBuffer);

// Text message
const message = await client.postText('/messages', 'Hello from Flux!');
```

### Error Handling

Comprehensive error handling with specific error types:

```typescript
const client = new HttpClient('https://api.example.com');

try {
  const response = await client.get('/users/1');
  console.log('Success:', response.data);
} catch (error) {
  console.error('Request failed:', error.message);
  
  // Check for specific error types
  if (error.message.includes('timeout')) {
    console.log('Request timed out');
  } else if (error.message.includes('404')) {
    console.log('Resource not found');
  }
}

// Usage
const perfClient = new PerformanceClient('https://api.example.com');
const result = await perfClient.getWithMetrics('/users/1');

console.log('Data:', result.data);
console.log('TTFB:', result.metrics.ttfb + 'ms');
console.log('Total:', result.metrics.total + 'ms');
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Common Issues

1. **Connection Errors**: Check network connectivity and URL validity
2. **Timeout Errors**: Increase timeout value for slow connections
3. **TLS Errors**: Verify SSL certificate validity
4. **Parsing Errors**: Check response content type

### Clean Build

```bash
npm run clean
npm run build
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.8.3 (for development)

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### 1.1.0
- **Comprehensive Test Suite**: Added extensive test coverage with 4 test files
- **Testing Infrastructure**: Added Jest configuration with ESM support, coverage reporting, and CI setup
- **Code Quality**: Added ESLint configuration for code linting and formatting
- **Documentation**: Added detailed optimization analysis (`OPTIMIZATION_ANALYSIS.md`) with bundle size comparisons
- **Build System**: Enhanced build scripts with minification, bundle size analysis, and CI pipeline
- **Performance Monitoring**: Added memory usage tests and concurrent request handling validation
- **Error Handling**: Comprehensive error class testing and validation
- **Type Safety**: Enhanced TypeScript type definitions and validation

### 1.0.0
- Initial release
- Full TypeScript support
- Performance timing metrics
- Authentication support
- Comprehensive error handling
- Content type detection
- ES module support 