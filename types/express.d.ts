
import 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        id:     string;
        email:  string;
        name:   string;
        domain?: string;  // if you use this elsewhere
      };
    }
  }
}
