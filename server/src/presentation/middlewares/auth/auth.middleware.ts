import { Request, Response, NextFunction } from "express";

import { container } from "#di/inversify.config.js";
import { TYPES } from "#di/types.js";
import { IAuthenticator } from "./authenticator.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.context = {
    userId: 0,
  };
  const authenticator = container.get<IAuthenticator>(TYPES.Authenticator);
  authenticator.authenticate(req, res, next);
};
