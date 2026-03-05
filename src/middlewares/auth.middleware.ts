import { Request, Response, NextFunction } from "express";
import { verifyToken, UserJwtPayload } from "../utils/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserJwtPayload;
  }
}

// agent:security — JWT Verification middleware using HTTPOnly cookies
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const accessToken = (req.cookies as Record<string, string>)?.accessToken;
  const token: string | undefined =
    accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ status: "error", message: "未提供認證 token" });
    return;
  }

  try {
    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ status: "error", message: "無效或過期的 token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: "error", message: "未認證的請求" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ status: "error", message: "權限不足" });
      return;
    }

    next();
  };
};
