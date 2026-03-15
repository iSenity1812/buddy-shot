import { Request, Response, NextFunction } from "express";

import { ErrorCodes } from "../errors/error-code";
import { fail } from "../http/builder/response.factory";
import { AppError } from "../errors/error";
import { envConfig } from "../config/env.config";

type AppErrorLike = {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
};

function isAppErrorLike(err: unknown): err is AppErrorLike {
  if (!err || typeof err !== "object") return false;

  const candidate = err as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.statusCode === "number"
  );
}

// api not found middleware
export function notFoundMiddleware(_: Request, res: Response) {
  return res.status(404).json(
    fail({
      code: ErrorCodes.NOT_FOUND,
      message: "API endpoint not found.",
    }),
  );
}

// global error handling middleware
export function errorMiddleware(
  err: unknown,
  _: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError || isAppErrorLike(err)) {
    const appErr = err as AppErrorLike;
    return res.status(appErr.statusCode).json(
      fail(
        {
          code: appErr.code,
          message: appErr.message,
          details: appErr.details,
        },
        {},
      ),
    );
  }

  if (envConfig.nodeEnv === "development") {
    console.error(err);
  }

  return res.status(500).json(
    fail({
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred.",
    }),
  );
}
