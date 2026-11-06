import { createFxReferenceHandler } from '../../src/server/fxReference.js';
const handler = createFxReferenceHandler();
export function onRequest({ request }: { request: Request }): Promise<Response> {
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  return handler(request, cache);
}
