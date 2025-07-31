/**
 * Example usage of the TypeScript HTTP Client
 */

import HttpClient, { HttpResponse, RequestConfig } from './index.js';

// Example interfaces for type-safe API responses
interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
}

async function exampleUsage() {
  console.log('🚀 TypeScript HTTP Client Example\n');

  // Create a new HTTP client with base URL
  const client = new HttpClient('https://jsonplaceholder.typicode.com');

  try {
    // Example 1: GET request with type safety
    console.log('1. Making a GET request with type safety...');
    const userResponse: HttpResponse<User> = await client.get<User>('/users/1');
    console.log('User data:', userResponse.data);
    console.log('Time to first byte:', userResponse.timings.ttfb + 'ms');
    console.log('TLS Handshake:', userResponse.timings.tlsHandshake + 'ms');
    console.log('Total:', userResponse.timings.total + 'ms', '\n');

    // Example 2: POST request with typed request and response
    console.log('2. Making a POST request with typed request/response...');
    const newUser: CreateUserRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe'
    };

    const createResponse: HttpResponse<User> = await client.post<User>('/users', newUser);
    console.log('Created user:', createResponse.data);
    console.log('Status code:', createResponse.statusCode, '\n');

    // Example 3: PUT request
    console.log('3. Making a PUT request...');
    const updateData = { name: 'Jane Doe' };
    const updateResponse: HttpResponse<User> = await client.put<User>('/users/1', updateData);
    console.log('Updated user:', updateResponse.data, '\n');

    // Example 4: DELETE request
    console.log('4. Making a DELETE request...');
    const deleteResponse: HttpResponse<{}> = await client.delete('/users/1');
    console.log('Delete response status:', deleteResponse.statusCode, '\n');

    // Example 5: Custom configuration
    console.log('5. Making a request with custom configuration...');
    const customConfig: RequestConfig = {
      headers: {
        'X-Custom-Header': 'custom-value',
        'Accept': 'application/json'
      },
      timeout: 5000
    };

    const customResponse: HttpResponse<User[]> = await client.get<User[]>('/users', customConfig);
    console.log('Users count:', Array.isArray(customResponse.data) ? customResponse.data.length : 'N/A');
    console.log('Custom headers used:', customConfig.headers, '\n');

    // Example 6: Authentication
    console.log('6. Setting authentication token...');
    client.setAuthToken('your-auth-token-here');
    console.log('Auth token set. All subsequent requests will include Authorization header.\n');

    // Example 7: Error handling
    console.log('7. Testing error handling...');
    try {
      await client.get('/nonexistent-endpoint');
    } catch (error) {
      console.log('Expected error caught:', (error as Error).message);
    }

    // Example 8: Working with different content types
    console.log('\n8. Testing different content types...');
    
    // JSON response
    const jsonResponse: HttpResponse<Post[]> = await client.get<Post[]>('/posts');
    console.log('JSON response type:', typeof jsonResponse.data);
    
    // Text response (simulated)
    const textClient = new HttpClient('https://httpbin.org');
    const textResponse: HttpResponse<string> = await textClient.get<string>('/text/plain');
    console.log('Text response type:', typeof textResponse.data);

  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Example with generic API client
class TypedApiClient {
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

async function typedApiExample() {
  console.log('\n🔧 Typed API Client Example\n');

  const apiClient = new TypedApiClient('https://jsonplaceholder.typicode.com');

  try {
    // Get all users with full type safety
    const users = await apiClient.getUsers();
    console.log('All users:', users.length);

    // Get specific user
    const user = await apiClient.getUser(1);
    console.log('User 1:', user.name);

    // Create new user
    const newUser = await apiClient.createUser({
      name: 'Alice Smith',
      email: 'alice@example.com',
      username: 'alicesmith'
    });
    console.log('Created user:', newUser);

  } catch (error) {
    console.error('Error in typed API example:', error);
  }
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().then(() => {
    return typedApiExample();
  }).catch(console.error);
}

export { exampleUsage, typedApiExample, TypedApiClient }; 