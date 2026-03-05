import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";
import { logger } from "../utils/logger";
import { config } from "../config";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  // Handle SyntaxError from express.json()
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      status: "error",
      message: "無效的 JSON 格式",
    });
    return;
  }

  // Unhandled errors
  logger.error(err, "Unhandled Error");

  const responseMessage =
    config.env === "production" ? "伺服器內部錯誤" : err.message;

  res.status(500).json({
    status: "error",
    message: responseMessage,
    ...(config.env !== "production" && { stack: err.stack }),
  });
};
