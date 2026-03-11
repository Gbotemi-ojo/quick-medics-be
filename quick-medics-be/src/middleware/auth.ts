import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// If you have a config file, keep this. Otherwise, use process.env directly.
// Make sure this matches the secret used in your auth.controller.ts!
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

// Extend the Request type to include the user property
// This must match the payload you signed in auth.controller.ts
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

/**
 * Authenticate Middleware
 * Verifies the JWT token from the Authorization header.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  
  // Format expected: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication token required.' });
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    
    // Attach the user to the request object so controllers can access it
    (req as AuthenticatedRequest).user = user;
    
    next(); // Pass control to the next handler
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(403).json({ message: 'Invalid or expired token.' });
    return;
  }
};
