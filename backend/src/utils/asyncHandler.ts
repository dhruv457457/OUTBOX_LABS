import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Express 4 doesn't forward rejections from async handlers, so without this a thrown
 *  error leaves the request hanging instead of reaching the error middleware. */
export function asyncHandler<T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req as T, res, next).catch(next);
  };
}
