import "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        tenantId: string;
        role: import("@backoffice/shared").Role;
        csrf: string;
      };
    }
  }
}
