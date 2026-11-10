import type { IncomingMessage, ServerResponse } from 'node:http';

export type ApiRequest = IncomingMessage & { body?: unknown };
export type ApiResponse = ServerResponse;

export async function handleApiRoute(route: string, req: ApiRequest, res: ApiResponse) {
  try {
    const { app } = await import('./backend/src/app.js');
    const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = `/api/${route}${query}`;
    return app(req as any, res as any);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    console.error('API function failed to start:', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'API function failed to start', detail: message }));
    }
  }
}
