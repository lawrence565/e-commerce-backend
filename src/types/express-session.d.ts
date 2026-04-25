import "express-session";

import type { CartItem, UserProfile } from "./domain.js";

declare module "express-session" {
  interface SessionData {
    cart?: CartItem[];
    profile?: UserProfile;
  }
}
