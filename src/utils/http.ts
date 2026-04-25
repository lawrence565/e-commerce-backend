import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(handler: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export function parsePositiveInteger(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function sendBadRequest(res: Response, message: string) {
  res.status(400).json({ status: "error", message });
}

export function sendServerError(res: Response, message: string, error: unknown) {
  console.error(message, error);
  res.status(500).json({ status: "error", message });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ status: "error", message: "找不到資源" });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) {
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      status: "error",
      message: "請求資料格式錯誤",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  console.error("Unhandled request error:", error);
  res.status(500).json({
    status: "error",
    message: "伺服器發生錯誤，請稍後再試",
  });
}
