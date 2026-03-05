import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "fallback_secret_should_not_be_used"
);

export type UserJwtPayload = JWTPayload & {
  userId: number;
  email: string;
  role: string;
};

export const generateToken = async (
  payload: { userId: number; email: string; role: string },
  expiresIn: string = "2h"
): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
};

export const verifyToken = async (token: string): Promise<UserJwtPayload> => {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as UserJwtPayload;
};
