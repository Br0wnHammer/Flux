# Lightweight HTTP Client with Performance Timing

A high-performance, Node.js-specific HTTP client that provides detailed timing metrics including TLS handshake duration, time to first byte (TTFB), and total request time.

## ✨ Features

- 🚀 **Performance Timing**: Detailed timing metrics for every request
- 🔐 **TLS Handshake Measurement**: Precise SSL/TLS handshake duration
- ⚡ **Time to First Byte (TTFB)**: Network latency measurement
- 📊 **Total Request Time**: Complete request lifecycle timing
- 🛡️ **Node.js Native**: Built specifically for Node.js environments
- 📦 **ES Modules**: Modern ES6+ module system
- 🔧 **Zero Dependencies**: Pure Node.js implementation
- 🎯 **TypeScript Ready**: Full JSDoc documentation

## 📦 Installation

```bash
# Clone or download the http-client.js file
```

## 🚀 Quick Start

```javascript
import HttpClient from './http-client.js';

// Create a client with base URL
const client = new HttpClient('https://api.example.com');

// Make a request with timing data
const result = await client.get('/posts/1');

console.log('Data:', result.data);
console.log('Total time:', result.timings.total.toFixed(2) + 'ms');
console.log('TLS Handshake:', result.timings.tlsHandshake?.toFixed(2) + 'ms');
console.log('Time to first byte:', result.timings.ttfb?.toFixed(2) + 'ms');
```

## 📚 API Reference

### Constructor

```javascript
new HttpClient(baseURL, defaultConfig)
```

**Parameters:**
- `baseURL` (string, optional): Base URL for all requests
- `defaultConfig` (object, optional): Default configuration

**Example:**
```javascript
const client = new HttpClient('https://api.example.com', {
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0'
  },
  timeout: 10000
});
```

### HTTP Methods

#### GET Request
```javascript
const result = await client.get(endpoint, config)
```

#### POST Request
```javascript
const result = await client.post(endpoint, data, config)
```

#### PUT Request
```javascript
const result = await client.put(endpoint, data, config)
```

#### DELETE Request
```javascript
const result = await client.delete(endpoint, config)
```

### Response Format

All methods return a consistent response object:

```javascript
{
  data: any,           // Parsed response data
  timings: {
    total: number,      // Total request time in milliseconds
    tlsHandshake: number | null,  // TLS handshake time (HTTPS only)
    ttfb: number | null // Time to first byte in milliseconds
  },
  statusCode: number,   // HTTP status code
  headers: object       // Response headers
}
```

### Configuration Options

```javascript
{
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  timeout: 10000,      // Request timeout in milliseconds
  rawResponse: false   // Return raw response object
}
```

## 📊 Timing Metrics Explained

### Total Request Time
- **What**: Complete time from request start to response end
- **Includes**: DNS resolution, connection, TLS handshake, data transfer
- **Use Case**: Overall performance measurement

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