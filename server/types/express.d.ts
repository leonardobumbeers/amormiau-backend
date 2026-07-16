import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: Types.ObjectId | string;
        role: 'basic' | 'supervisor' | 'admin';
        cats: Array<Types.ObjectId | string>;
      };
    }
  }
}

export {};
