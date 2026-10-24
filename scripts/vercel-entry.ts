// The entry of the Vercel function: the whole Express app (bundled into .vercel/output by vercel-output.mjs).
// It lives outside api/ on purpose: Vercel treats an api/ folder as its own functions folder and then answers 404
// for every /api/... path that is not a file there, before the route that sends /api/* to this function.
import app from "../server";

export default app;
