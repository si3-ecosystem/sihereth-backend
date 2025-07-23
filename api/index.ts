import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../main';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
