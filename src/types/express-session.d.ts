import "express-session";
import { CartItem } from "./cart.types";

declare module "express-session" {
  interface SessionData {
    cart?: CartItem[];
  }
}
