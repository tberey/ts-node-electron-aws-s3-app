import { Server } from './Server';

const port = '3000';
const hostname = '127.0.0.1';

const server: object = {
    
    'Name': 'HTTP REST API',
    'Description': 'Create and start http server.',
    'Port': port,
    'Hostname': hostname,
    'Action': new Server(port, hostname),
};
server;