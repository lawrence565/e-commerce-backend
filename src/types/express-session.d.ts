import session from "express-session";
declare module "express-session" {
  interface SessionData {
    cart?: { productId: number; category: string; quantity: number }[];
  }
}
