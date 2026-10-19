import type { NextFunction, Request, Response } from "express";
import { languageFromCookies, localizeBody } from "../i18n/serverMessages";

/**
 * Express middleware: sends API error messages in the language the browser displays.
 * Routes keep writing French messages; JSON bodies are translated on the way out (see i18n/serverMessages.ts).
 */
export function localizeResponses(req: Request, res: Response, next: NextFunction) {
  const language = languageFromCookies(req.headers.cookie);
  const json = res.json.bind(res);
  res.json = (body?: unknown) => json(localizeBody(body, language));
  next();
}
