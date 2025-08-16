import { Request, Response, NextFunction } from "express";

import { Logger } from "#utils/logger.js";

export function requestLogger(logger: Logger) {
  return function (req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    const userId = req.context?.userId ?? "anonymous";

    logger.debug(`[${method}] ${originalUrl} requested by user ${userId}`);

    res.on("finish", () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

      logger[level](
        `[${method}] ${originalUrl} ${status} - ${duration}ms | User ${userId}`,
      );
    });

    next();
  };
}
