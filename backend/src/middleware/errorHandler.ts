import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { ZodError } from "zod";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
        error: err.issues.map(i => i.message).join(", "),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    message: "Internal Server Error",
  });
};