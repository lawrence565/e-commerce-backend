import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

router.get("/:_category?/:_id?", ProductController.getProducts);

export default router;
