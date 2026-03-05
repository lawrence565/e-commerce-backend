import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

/**
 * @openapi
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Retrieve a paginated list of products
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of products with pagination metadata
 */
// agent:route — GET /api/products — Fetches paginated products. Cached via Redis.
router.get("/", ProductController.getProducts);

// agent:route — GET /api/getProduct/:category/:id — Legacy backward compatibility route.
router.get("/:_category?/:_id?", ProductController.getProducts);

export default router;
