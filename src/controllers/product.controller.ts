import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import { asyncHandler } from "../utils/async-handler";

export class ProductController {
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { _category, _id } = req.params;
    const products = await ProductService.getProducts(_category, _id);
    res.status(200).json({ status: "ok", data: products });
  });
}
