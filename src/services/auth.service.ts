import { UserRepository } from "../repositories/user.repository";
import * as argon2 from "argon2";
import { generateToken } from "../utils/jwt";
import { ApiError } from "../utils/api-error";

export class AuthService {
  static async register(email: string, password: string) {
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, "該信箱已被註冊");
    }

    const passwordHash = await argon2.hash(password);
    const newUser = await UserRepository.create(email, passwordHash);

    // Don't return the password hash
    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
  }

  static async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      throw new ApiError(401, "信箱或密碼錯誤");
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
