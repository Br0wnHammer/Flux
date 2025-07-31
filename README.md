# Flux - HTTP Client with Performance Timing

A simple, flexible, and **type-safe** HTTP client for TypeScript with comprehensive type definitions and interfaces.

## Features

- **Full TypeScript Support** - Complete type safety with interfaces and generics
- **Comprehensive Type Definitions** - All request/response types are properly typed
- **Generic Methods** - Type-safe HTTP methods with generic response types
- **Error Handling** - Custom error classes with proper typing
- **Request Timing** - Built-in performance monitoring
- **Authentication** - Easy token-based authentication
- **Custom Headers** - Flexible header management
- **Multiple HTTP Methods** - GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Response Parsing** - Automatic content-type detection and parsing
- **Timeout Support** - Configurable request timeouts
- **Base URL Support** - Convenient base URL configuration

## Installation

```bash
npm install flux
```

## Quick Start

```typescript
import HttpClient from 'flux';

// Create a client with base URL
const client = new HttpClient('https://api.example.com');

// Type-safe GET request
interface User {
  id: number;
  name: string;
  email: string;
}

const response = await client.get<User>('/users/1');
console.log(response.data.name); // TypeScript knows this is a User
```

## API Reference

### Constructor

```typescript
new HttpClient(baseURL?: string, defaultConfig?: Partial<DefaultConfig>)
```

**Parameters:**
- `baseURL` (optional): Base URL for all requests
- `defaultConfig` (optional): Default configuration object

### HTTP Methods

All methods support generic types for type-safe responses:

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
  method?: HttpMethod;
  headers?: Record<string, string>;
  timeout?: number;
  body?: string | Buffer;
  rawResponse?: boolean;
}
```

#### HttpResponse
```typescript
interface HttpResponse<T = ResponseData> {
  data: T;
  timings: ResponseTimings;
  statusCode: number;
  headers: IncomingHttpHeaders;
}
```

#### ResponseTimings
```typescript
interface ResponseTimings {
  start: bigint;
  tlsHandshake: bigint | null;
  ttfb: bigint | null; // Time to first byte
  total: bigint | null;
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


## Examples

### Basic Usage

```typescript
import HttpClient from 'flux';

const client = new HttpClient('https://jsonplaceholder.typicode.com');

// Simple GET request
const users = await client.get<User[]>('/users');
console.log(users.data.length);

// POST with data
const newUser = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

```

### TLS Handshake Duration
- **What**: Time to establish secure connection (HTTPS only)
- **Includes**: Certificate verification, key exchange
- **Use Case**: SSL/TLS performance analysis

### Time to First Byte (TTFB)
- **What**: Time until first response byte is received
- **Includes**: Server processing time + network latency
- **Use Case**: Server responsiveness measurement

## 🔧 Advanced Configuration

### Setting Default Headers

```javascript
client.setDefaultHeaders({
  'X-API-Key': 'your-api-key',
  'User-Agent': 'MyApp/1.0'
});
```

### Custom Authentication

```javascript
// Bearer token (default)
client.setAuthToken('your-token');

// Custom auth type
client.setAuthToken('your-token', 'Custom');

// Clear authentication
client.clearAuthToken();
```

### Error Handling

```javascript
try {
  const result = await client.get('/posts/1');
  console.log('Success:', result.data);
} catch (error) {
  console.error('Request failed:', error.message);
  
  // Check for specific error types
  if (error.message.includes('timeout')) {
    console.log('Request timed out');
  } else if (error.message.includes('404')) {
    console.log('Resource not found');
  }
}
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
node test.js
```

## 📈 Performance Benefits

- **Native Node.js**: No external dependencies
- **Precise Timing**: High-resolution timing with `process.hrtime.bigint()`
- **Memory Efficient**: Minimal memory footprint
- **Fast Parsing**: Optimized response parsing
- **Error Resilient**: Robust error handling

### Common Issues

1. **Connection Errors**: Check network connectivity and URL validity
2. **Timeout Errors**: Increase timeout value for slow connections
3. **TLS Errors**: Verify SSL certificate validity
4. **Parsing Errors**: Check response content type

### Building

No build step required - pure JavaScript with ES modules.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ for Node.js performance monitoring** 