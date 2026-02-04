import http from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger';

type ClientMeta = { id: string };

export function attachWsServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    const client: ClientMeta = { id: crypto.randomUUID() };

    logger.info(`WS connected: ${client.id}`);

    socket.send(JSON.stringify({ type: 'hello', clientId: client.id }));

    socket.on('close', () => {
      logger.info(`WS disconnected: ${client.id}`);
    });
  });

  function broadcast(raw: string) {
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(raw);
      }
    }
  }

  return { broadcast };
}
