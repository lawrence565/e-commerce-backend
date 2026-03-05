import { Router } from "express";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import orderRoutes from "./order.routes";
import authRoutes from "./auth.routes";
import { CartController } from "../controllers/cart.controller";

const router = Router();

// Modular Routes
router.use("/getProduct", productRoutes); // Keeps backward compatibility with /api/getProduct
router.use("/cart", cartRoutes);
router.use("/order", orderRoutes);
router.use("/", authRoutes);

// Special case to keep backward compatibility with the existing delete /api/carts endpoint
router.delete("/carts", CartController.clearCart);

export default router;
