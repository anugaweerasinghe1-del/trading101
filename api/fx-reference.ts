import type { IncomingMessage, ServerResponse } from 'node:http';
import { createFxReferenceHandler } from '../src/server/fxReference.js';
const read = createFxReferenceHandler();
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const response = await read(new Request('https://www.thetradehq.com/api/fx-reference' + query, { method: req.method ?? 'GET' }));
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}
