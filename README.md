# Simple Onion Router Network

This project implements a simple onion routing network that allows for anonymous message passing between users.

## Overview

The network consists of:
- A central registry where nodes register themselves
- Onion router nodes that relay encrypted messages
- Users who can send and receive messages

Messages are encrypted in multiple layers (like an onion), with each node in the circuit peeling off one layer before forwarding the message to the next destination.

## Components

1. **Registry**: Keeps track of all onion router nodes and their public keys
2. **Onion Routers**: Receive encrypted messages, decrypt one layer, and forward to the next destination
3. **Users**: Can send messages through the network and receive messages

## Message Flow

1. A user wants to send a message to another user
2. The sender creates a random circuit of 3 nodes
3. The message is wrapped in multiple layers of encryption
4. The encrypted message travels through the circuit
5. Each node removes one layer of encryption and forwards it
6. The recipient receives the original message

## Setup

### Prerequisites

- Node.js (v14 or later)
- npm

### Installation

1. Clone the repository:

git clone https://github.com/yourusername/onion-router-network.git
cd onion-router-network


2. Install dependencies:

npm install


### Running the Network

Start the network with a specific number of nodes and users:

npm start <number_of_nodes> <number_of_users>


By default, the network starts with 3 nodes and 2 users if no arguments are provided.

## Testing

Run the tests with:

npm test


## Routes

### Registry Routes
- GET `/status`: Check if the registry is live
- POST `/registerNode`: Register a node with the registry
- GET `/getNodeRegistry`: Get the list of registered nodes

### Node Routes
- GET `/status`: Check if the node is live
- GET `/getLastReceivedEncryptedMessage`: Get the last received encrypted message
- GET `/getLastReceivedDecryptedMessage`: Get the last received decrypted message
- GET `/getLastMessageDestination`: Get the destination of the last message
- GET `/getPrivateKey`: Get the node's private key (for testing only)
- POST `/message`: Send a message to the node

### User Routes
- GET `/status`: Check if the user is live
- GET `/getLastReceivedMessage`: Get the last received message
- GET `/getLastSentMessage`: Get the last sent message
- POST `/message`: Send a message to the user
- POST `/sendMessage`: Send a message through the onion routing network