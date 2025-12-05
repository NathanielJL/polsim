import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/auth';

export interface AuthRequest extends Request {
  playerId?: string;
  username?: string;
}

/**
 * Middleware to verify JWT token and attach player info to request
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.playerId = decoded.playerId;
  req.username = decoded.username;
  next();
}

/**
 * Optional auth middleware - doesn't fail if token missing
 */
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.playerId = decoded.playerId;
      req.username = decoded.username;
    }
  }

  next();
}
