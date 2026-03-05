import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  CartItemSchema,
  CookieCartSchema,
  UpdateCartItemSchema,
} from "../schemas/cart.schema";

const router = Router();

router.get("/", CartController.getCart);
router.post("/", validate(CartItemSchema), CartController.addItem);
router.put("/", validate(CookieCartSchema), CartController.mergeCart);
router.put("/:id", validate(UpdateCartItemSchema), CartController.updateItem);
router.delete("/:id", CartController.removeItem);

export default router;
