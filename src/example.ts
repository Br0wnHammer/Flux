/**
 * Example usage of the TypeScript HTTP Client
 */

import HttpClient, { HttpResponse } from './index.js';

// Example interfaces for type-safe API responses
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

async function exampleUsage() {
  console.log('🚀 TypeScript HTTP Client Example\n');

  // Create a new HTTP client with base URL
  const client = new HttpClient('https://jsonplaceholder.typicode.com');

  try {
    // Example 1: GET request with type safety
    console.log('1. Making a GET request with type safety...');
    const userResponse: HttpResponse<any> = await client.get<any>('/users');
    console.log('User data:', userResponse.data);
    console.log('Time to first byte:', userResponse.timings.ttfb + 'ms');
    console.log('TLS Handshake:', userResponse.timings.tlsHandshake ? userResponse.timings.tlsHandshake + 'ms' : 'N/A');
    console.log('Total:', userResponse.timings.total + 'ms', '\n');


    console.log('2. MUI Fetch Details');
    const playstationClient: HttpResponse<any> = await client.get<any>('https://mui.com/material-ui/');
    console.log('Playstation data:', playstationClient.data);
    console.log('Time to first byte:', playstationClient.timings.ttfb + 'ms');
    console.log('TLS Handshake:', playstationClient.timings.tlsHandshake ? playstationClient.timings.tlsHandshake + 'ms' : 'N/A');
    console.log('Total:', playstationClient.timings.total + 'ms', '\n');
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

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().then(() => {
  }).catch(console.error);
}

export { exampleUsage, TypedApiClient }; 