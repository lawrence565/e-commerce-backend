import { queryDatabase } from "../config/database";
import { User } from "../types/user.types";

export class UserRepository {
  static async findByEmail(email: string): Promise<User | undefined> {
    const result = await queryDatabase("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0] as User | undefined;
  }

  static async create(email: string, passwordHash: string): Promise<User> {
    const result = await queryDatabase(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role, created_at",
      [email, passwordHash]
    );
    return result.rows[0] as User;
  }
}
