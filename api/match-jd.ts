import { handleApiRoute, type ApiRequest, type ApiResponse } from '../vercel-handler.js';

export default function handler(req: ApiRequest, res: ApiResponse) {
  return handleApiRoute('match-jd', req, res);
}