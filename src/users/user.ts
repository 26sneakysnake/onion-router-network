import express from 'express';
import axios from 'axios';
import { BASE_USER_PORT, REGISTRY_PORT } from '../config';
import { generateSymmetricKey, encryptWithSymmetricKey, encryptWithPublicKey } from '../crypto';
import { NodeInfo } from '../registry/registry';

export class User {
  private app = express();
  private userId: number;
  private port: number;
  
  // State for tracking messages
  private lastReceivedMessage: string | null = null;
  private lastSentMessage: string | null = null;
  
  constructor(userId: number) {
    this.userId = userId;
    this.port = BASE_USER_PORT + userId;
    
    this.setupRoutes();
  }
  
  private setupRoutes() {
    this.app.use(express.json());
    
    // Status route
    this.app.get('/status', (req, res) => {
      res.send('live');
    });
    
    // Get last received message
    this.app.get('/getLastReceivedMessage', (req, res) => {
      res.json({ result: this.lastReceivedMessage });
    });
    
    // Get last sent message
    this.app.get('/getLastSentMessage', (req, res) => {
      res.json({ result: this.lastSentMessage });
    });
    
    // Receive message route
    this.app.post('/message', (req, res) => {
      const { message } = req.body;
      this.lastReceivedMessage = message;
      res.status(200).json({ success: true });
    });
    
    // Send message route
    this.app.post('/sendMessage', async (req, res) => {
      const { message, destinationUserId } = req.body;
      
      // Update last sent message
      this.lastSentMessage = message;
      
      try {
        // Get the node registry
        const registryResponse = await axios.get(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`);
        const nodes: NodeInfo[] = registryResponse.data.nodes;
        
        if (nodes.length < 3) {
          return res.status(400).json({ error: 'Not enough nodes in the registry. Need at least 3 nodes.' });
        }
        
        // Select 3 distinct random nodes for the circuit
        const circuit = this.selectRandomCircuit(nodes, 3);
        
        // Create the onion-encrypted message
        const encryptedMessage = this.createOnionEncryptedMessage(
          message, 
          circuit, 
          BASE_USER_PORT + destinationUserId
        );
        
        // Send the message to the entry node
        const entryNodePort = BASE_ONION_ROUTER_PORT + circuit[0].nodeId;
        await axios.post(`http://localhost:${entryNodePort}/message`, {
          message: encryptedMessage
        });
        
        res.status(200).json({ success: true });
      } catch (error) {
        console.error(`Error sending message: ${error}`);
        res.status(500).json({ error: 'Error sending message' });
      }
    });
  }
  
  private selectRandomCircuit(nodes: NodeInfo[], count: number): NodeInfo[] {
    // Make a copy of the nodes array
    const nodesCopy = [...nodes];
    const circuit: NodeInfo[] = [];
    
    // Select 'count' random nodes
    for (let i = 0; i < count; i++) {
      if (nodesCopy.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * nodesCopy.length);
      circuit.push(nodesCopy[randomIndex]);
      nodesCopy.splice(randomIndex, 1);
    }
    
    return circuit;
  }
  
  private createOnionEncryptedMessage(
    message: string, 
    circuit: NodeInfo[], 
    destinationUserPort: number
  ): string {
    // Start with the original message and the final destination (user)
    let currentMessage = message;
    let currentDestination = destinationUserPort;
    
    // Create layers of encryption in reverse order (from exit node to entry node)
    for (let i = circuit.length - 1; i >= 0; i--) {
      const node = circuit[i];
      
      // Generate a symmetric key for this layer
      const symmetricKey = generateSymmetricKey();
      
      // Format the destination with leading zeros (10 characters)
      const formattedDestination = currentDestination.toString().padStart(10, '0');
      
      // Concatenate the destination and the current message
      const dataToEncrypt = formattedDestination + currentMessage;
      
      // Encrypt the data with the symmetric key
      const encryptedData = encryptWithSymmetricKey(dataToEncrypt, symmetricKey);
      
      // Encrypt the symmetric key with the node's public key
      const encryptedSymKey = encryptWithPublicKey(symmetricKey, node.pubKey);
      
      // Combine the encrypted symmetric key and encrypted data
      currentMessage = encryptedSymKey + '.' + encryptedData;
      
      // Update the destination for the next iteration (if there is one)
      if (i > 0) {
        currentDestination = BASE_ONION_ROUTER_PORT + node.nodeId;
      }
    }
    
    return currentMessage;
  }
  
  public start() {
    this.app.listen(this.port, () => {
      console.log(`User ${this.userId} listening on port ${this.port}`);
    });
  }
}