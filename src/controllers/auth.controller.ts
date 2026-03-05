import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../utils/async-handler";
import { config } from "../config";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as Record<string, string>;
    const newUser = await AuthService.register(email, password);
    res.status(201).json({ status: "ok", data: newUser });
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as Record<string, string>;
    const { token, user } = await AuthService.login(email, password);

    const isProduction = config.env === "production";

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.status(200).json({ status: "ok", data: user });
  });
}
