import express from 'express';
import axios from 'axios';
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from '../config';
import { generateRsaKeyPair, decryptWithPrivateKey, decryptWithSymmetricKey } from '../crypto';

export class SimpleOnionRouter {
  private app = express();
  private nodeId: number;
  private port: number;
  private privateKey: string;
  private publicKey: string;
  
  // State for tracking messages
  private lastReceivedEncryptedMessage: string | null = null;
  private lastReceivedDecryptedMessage: string | null = null;
  private lastMessageDestination: number | null = null;
  
  constructor(nodeId: number) {
    this.nodeId = nodeId;
    this.port = BASE_ONION_ROUTER_PORT + nodeId;
    
    // Generate RSA key pair
    const keys = generateRsaKeyPair();
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;
    
    this.setupRoutes();
  }
  
  private setupRoutes() {
    this.app.use(express.json());
    
    // Status route
    this.app.get('/status', (req, res) => {
      res.send('live');
    });
    
    // Get last received encrypted message
    this.app.get('/getLastReceivedEncryptedMessage', (req, res) => {
      res.json({ result: this.lastReceivedEncryptedMessage });
    });
    
    // Get last received decrypted message
    this.app.get('/getLastReceivedDecryptedMessage', (req, res) => {
      res.json({ result: this.lastReceivedDecryptedMessage });
    });
    
    // Get last message destination
    this.app.get('/getLastMessageDestination', (req, res) => {
      res.json({ result: this.lastMessageDestination });
    });
    
    // Get private key (for testing purposes)
    this.app.get('/getPrivateKey', (req, res) => {
      res.json({ result: this.privateKey });
    });
    
    // Message handling route
    this.app.post('/message', async (req, res) => {
      const { message } = req.body;
      
      // Update last received encrypted message
      this.lastReceivedEncryptedMessage = message;
      
      try {
        // Extract the symmetric key (first part) and the encrypted message (second part)
        const parts = message.split('.');
        const encryptedSymKey = parts[0];
        const encryptedData = parts[1];
        
        // Decrypt the symmetric key using the node's private key
        const symmetricKey = decryptWithPrivateKey(encryptedSymKey, this.privateKey);
        
        // Decrypt the message using the symmetric key
        const decryptedMessage = decryptWithSymmetricKey(encryptedData, symmetricKey);
        
        // Update last received decrypted message
        this.lastReceivedDecryptedMessage = decryptedMessage;
        
        // Extract the destination from the first 10 characters
        const destinationStr = decryptedMessage.substring(0, 10);
        const destination = parseInt(destinationStr);
        
        // Update last message destination
        this.lastMessageDestination = destination;
        
        // Extract the actual message (everything after the first 10 characters)
        const forwardMessage = decryptedMessage.substring(10);
        
        // Forward the message to the next destination
        await axios.post(`http://localhost:${destination}/message`, {
          message: forwardMessage
        });
        
        res.status(200).json({ success: true });
      } catch (error) {
        console.error(`Error processing message: ${error}`);
        res.status(500).json({ error: 'Error processing message' });
      }
    });
  }
  
  public async start() {
    // Start the server
    this.app.listen(this.port, () => {
      console.log(`Onion Router ${this.nodeId} listening on port ${this.port}`);
    });
    
    // Register with the registry
    try {
      await axios.post(`http://localhost:${REGISTRY_PORT}/registerNode`, {
        nodeId: this.nodeId,
        pubKey: this.publicKey
      });
      console.log(`Onion Router ${this.nodeId} registered with the registry`);
    } catch (error) {
      console.error(`Failed to register with registry: ${error}`);
    }
  }
}