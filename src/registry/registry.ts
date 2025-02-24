import express from 'express';
import { REGISTRY_PORT } from '../config';

export interface NodeInfo {
  nodeId: number;
  pubKey: string;
}

export class Registry {
  private app = express();
  private nodes: NodeInfo[] = [];
  
  constructor() {
    this.setupRoutes();
  }
  
  private setupRoutes() {
    this.app.use(express.json());
    
    // Status route
    this.app.get('/status', (req, res) => {
      res.send('live');
    });
    
    // Node registration route
    this.app.post('/registerNode', (req, res) => {
      const { nodeId, pubKey } = req.body;
      
      // Check if a node with this ID already exists
      const existingNode = this.nodes.find(node => node.nodeId === nodeId);
      if (existingNode) {
        return res.status(400).json({ error: 'Node with this ID already registered' });
      }
      
      // Register the node
      this.nodes.push({ nodeId, pubKey });
      
      res.status(200).json({ success: true });
    });
    
    // Get node registry route
    this.app.get('/getNodeRegistry', (req, res) => {
      res.json({ nodes: this.nodes });
    });
  }
  
  public start() {
    this.app.listen(REGISTRY_PORT, () => {
      console.log(`Registry listening on port ${REGISTRY_PORT}`);
    });
  }
}