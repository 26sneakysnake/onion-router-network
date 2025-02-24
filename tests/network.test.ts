import axios from 'axios';
import { BASE_ONION_ROUTER_PORT, BASE_USER_PORT, REGISTRY_PORT } from '../src/config';

// Helper function to wait for servers to start
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Onion Router Network', () => {
  beforeAll(async () => {
    // Wait for servers to be fully running
    await wait(2000);
  });

  test('Registry is running', async () => {
    const response = await axios.get(`http://localhost:${REGISTRY_PORT}/status`);
    expect(response.data).toBe('live');
  });

  test('Node registry contains nodes', async () => {
    const response = await axios.get(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`);
    expect(response.data).toHaveProperty('nodes');
    expect(Array.isArray(response.data.nodes)).toBeTruthy();
    expect(response.data.nodes.length).toBeGreaterThan(0);
  });

  test('Nodes are running', async () => {
    // Check first 3 nodes
    for (let i = 0; i < 3; i++) {
      const port = BASE_ONION_ROUTER_PORT + i;
      const response = await axios.get(`http://localhost:${port}/status`);
      expect(response.data).toBe('live');
    }
  });

  test('Users are running', async () => {
    // Check first 2 users
    for (let i = 0; i < 2; i++) {
      const port = BASE_USER_PORT + i;
      const response = await axios.get(`http://localhost:${port}/status`);
      expect(response.data).toBe('live');
    }
  });

  test('Can send and receive messages', async () => {
    const testMessage = 'Test message: ' + Date.now();
    
    // Send message from user 0 to user 1
    await axios.post(`http://localhost:${BASE_USER_PORT}/sendMessage`, {
      message: testMessage,
      destinationUserId: 1
    });
    
    // Wait for message to propagate through the network
    await wait(1000);
    
    // Check if user 1 received the message
    const response = await axios.get(`http://localhost:${BASE_USER_PORT + 1}/getLastReceivedMessage`);
    expect(response.data.result).toBe(testMessage);
  });
});