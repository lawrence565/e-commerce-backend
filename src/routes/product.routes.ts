import { Router } from "express";

import { queryDatabase } from "../db/client.js";
import type { ProductRow } from "../db/rows.js";
import { mapProductRow } from "../utils/mappers.js";
import { asyncHandler, parsePositiveInteger, sendBadRequest } from "../utils/http.js";

export const productRouter = Router();

productRouter.get(
  "/getProduct/:_category?/:_id?",
  asyncHandler(async (req, res) => {
    const { _category: category, _id: id } = req.params;
    let query = "SELECT * FROM products";
    const params: unknown[] = [];

    if (category && id) {
      const productId = parsePositiveInteger(id);
      if (productId === null) {
        sendBadRequest(res, "商品 ID 格式錯誤");
        return;
      }

      query += " WHERE category = $1 AND id = $2";
      params.push(category, productId);
    } else if (category && category !== "all") {
      query += " WHERE category = $1";
      params.push(category);
    }

    query += " ORDER BY id ASC";
    const products = await queryDatabase<ProductRow>(query, params);
    res.status(200).json({
      status: "ok",
      data: products.rows.map(mapProductRow),
    });
  })
);
