import type { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler = <
  P = Record<string, never>, // req.params
  ResBody = unknown, // res.json(...)
  ReqBody = unknown, // req.body
  ReqQuery = Record<string, unknown> // req.query
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => void | Promise<unknown>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    try {
      const result = fn(req as any, res, next);
      if (result instanceof Promise) {
        result.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
};