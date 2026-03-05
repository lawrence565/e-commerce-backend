import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

// RESTful style
router.get("/", ProductController.getProducts);

// Backward compatibility
router.get("/:_category?/:_id?", ProductController.getProducts);

export default router;
