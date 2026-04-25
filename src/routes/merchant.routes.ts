import { Router } from "express";

import { queryDatabase } from "../db/client.js";
import type {
  MerchantRecentOrderRow,
  MerchantSummaryRow,
  ProductRow,
} from "../db/rows.js";
import { productInputSchema } from "../schemas/api.schemas.js";
import { asyncHandler, parsePositiveInteger, sendBadRequest } from "../utils/http.js";
import { mapProductRow } from "../utils/mappers.js";

export const merchantRouter = Router();

merchantRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const summary = await queryDatabase<MerchantSummaryRow>(
      "SELECT COALESCE(SUM(price), 0) AS total_sales, COUNT(*) AS total_orders FROM orders"
    );
    const recent = await queryDatabase<MerchantRecentOrderRow>(
      "SELECT id, price, recipient, paid, shipped FROM orders ORDER BY order_date DESC LIMIT 5"
    );
    const summaryRow = summary.rows[0];

    res.status(200).json({
      status: "ok",
      data: {
        totalSales: Number(summaryRow?.total_sales ?? 0),
        totalOrders: Number(summaryRow?.total_orders ?? 0),
        recentOrders: recent.rows.map((order) => ({
          id: order.id,
          customer: order.recipient?.name ?? "未命名顧客",
          total: Number(order.price),
          status: order.shipped ? "Shipped" : order.paid ? "Paid" : "Pending",
        })),
      },
    });
  })
);

merchantRouter.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const products = await queryDatabase<ProductRow>(
      "SELECT * FROM products ORDER BY id ASC"
    );
    res.status(200).json({
      status: "ok",
      data: products.rows.map(mapProductRow),
    });
  })
);

merchantRouter.post(
  "/products",
  asyncHandler(async (req, res) => {
    const product = productInputSchema.parse(req.body);
    const result = await queryDatabase<ProductRow>(
      `
        INSERT INTO products (title, name, category, price, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        product.title,
        product.name,
        product.category,
        product.price,
        product.description,
      ]
    );
    const productRow = result.rows[0];

    if (!productRow) {
      throw new Error("Product insert did not return a row");
    }

    res.status(201).json({ status: "ok", data: mapProductRow(productRow) });
  })
);

merchantRouter.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const productId = parsePositiveInteger(req.params.id);
    const product = productInputSchema.parse(req.body);

    if (productId === null) {
      sendBadRequest(res, "商品 ID 格式錯誤");
      return;
    }

    const result = await queryDatabase<ProductRow>(
      `
        UPDATE products
        SET title = $1, name = $2, category = $3, price = $4, description = $5
        WHERE id = $6
        RETURNING *
      `,
      [
        product.title,
        product.name,
        product.category,
        product.price,
        product.description,
        productId,
      ]
    );
    const productRow = result.rows[0];

    if (!productRow) {
      res.status(404).json({ status: "error", message: "找不到商品" });
      return;
    }

    res.status(200).json({ status: "ok", data: mapProductRow(productRow) });
  })
);

merchantRouter.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const productId = parsePositiveInteger(req.params.id);

    if (productId === null) {
      sendBadRequest(res, "商品 ID 格式錯誤");
      return;
    }

    const result = await queryDatabase("DELETE FROM products WHERE id = $1", [
      productId,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ status: "error", message: "找不到商品" });
      return;
    }

    res.status(200).json({ status: "ok", message: "成功刪除" });
  })
);
