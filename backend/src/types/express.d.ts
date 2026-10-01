import { UserRole } from '@prisma/client';

/** 
* Interface for the payload of a JWT token.
* @property userId - The ID of the user.
* @property role - The role of the user.
**/
export interface TokenPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}