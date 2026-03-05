import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import { asyncHandler } from "../utils/async-handler";

export class ProductController {
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    // Support both /api/getProduct/:category/:id and RESTful /api/products?category=...
    const category = req.params._category || (req.query.category as string);
    const id = req.params._id || (req.query.id as string);

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const sort = (req.query.sort as string) || "id";
    const order = (req.query.order as string) === "desc" ? "desc" : "asc";

    const { products, total } = await ProductService.getProducts({
      category,
      id,
      page,
      limit,
      sort,
      order,
    });

    res.status(200).json({
      status: "ok",
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}
