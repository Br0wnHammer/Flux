// Jest setup file
import { TLSSocket } from 'tls';

// Increase max listeners for TLS sockets to prevent warnings
if (TLSSocket && TLSSocket.prototype) {
  TLSSocket.prototype.setMaxListeners(20);
}

export default {
  testTimeout: 10000, // 10 seconds timeout for tests
}; 