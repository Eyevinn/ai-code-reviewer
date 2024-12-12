import fastifyStatic from '@fastify/static';
import api from './api';
import path from 'path';

const server = api({ title: 'AI Code Reviewer' });
server.register(fastifyStatic, {
  root: path.join(__dirname, '../out'),
  prefix: '/'
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    throw err;
  }
  console.log(`Server listening on ${address}`);
});

export default server;
