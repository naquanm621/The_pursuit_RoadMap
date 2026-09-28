import { app } from './backend/src/app.js';

export type ApiRequest = Parameters<typeof app>[0];
export type ApiResponse = Parameters<typeof app>[1];

export function handleApiRoute(route: string, req: ApiRequest, res: ApiResponse) {
  const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  req.url = `/api/${route}${query}`;
  return app(req, res);
}