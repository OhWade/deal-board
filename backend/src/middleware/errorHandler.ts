import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

// Catches requests that matched no route
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: `Cannot ${req.method} ${req.originalUrl}` },
  });
};

// Express 5 forwards rejected promises from async handlers here automatically
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Malformed JSON body" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
};
