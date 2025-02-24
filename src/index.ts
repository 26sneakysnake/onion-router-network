import { Registry } from './registry/registry';
import { SimpleOnionRouter } from './onionRouters/simpleOnionRouter';
import { User } from './users/user';

// Get command line arguments
const args = process.argv.slice(2);
const numNodes = parseInt(args[0]) || 3; // Default to 3 nodes
const numUsers = parseInt(args[1]) || 2; // Default to 2 users

// Start the registry
const registry = new Registry();
registry.start();

// Wait a bit for the registry to start
setTimeout(async () => {
  // Start the onion routers
  const routers: SimpleOnionRouter[] = [];
  for (let i = 0; i < numNodes; i++) {
    const router = new SimpleOnionRouter(i);
    await router.start();
    routers.push(router);
  }
  
  // Start the users
  const users: User[] = [];
  for (let i = 0; i < numUsers; i++) {
    const user = new User(i);
    user.start();
    users.push(user);
  }
  
  console.log(`Started ${numNodes} onion routers and ${numUsers} users`);
}, 1000);