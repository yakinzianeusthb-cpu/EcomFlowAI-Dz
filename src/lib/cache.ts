import type { NextFunction, Request, Response } from "express";

/**
 * Lets the CDN (and the browser, briefly) reuse an identical response.
 * Only attach it to public GET endpoints whose payload never depends on who is asking,
 * so an admin edit is visible after at most `maxAge + sMaxAge` seconds.
 */
export function publicCache({ maxAge = 30, sMaxAge = 60, staleWhileRevalidate = 300 } = {}) {
  const value = `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", value);
    next();
  };
}
