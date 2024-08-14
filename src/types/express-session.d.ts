import session from "express-session";

// 扩展 SessionData 接口，添加 cart 属性
declare module "express-session" {
  interface SessionData {
    cart: { productId: number; quantity: number }[];
  }
}
