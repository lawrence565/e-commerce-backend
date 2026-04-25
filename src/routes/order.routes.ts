import { Router } from "express";

import { queryDatabase } from "../db/client.js";
import type { OrderRow } from "../db/rows.js";
import { orderSchema } from "../schemas/api.schemas.js";
import { asyncHandler, parsePositiveInteger, sendBadRequest } from "../utils/http.js";
import { mapOrderRow } from "../utils/mappers.js";

export const orderRouter = Router();

orderRouter.post(
  "/order",
  asyncHandler(async (req, res) => {
    const order = orderSchema.parse(req.body);
    const address = `${order.shippment.city}${order.shippment.district}${order.shippment.road}${order.shippment.detail}`;

    const response = await queryDatabase<OrderRow>(
      `
        INSERT INTO orders (order_date, products, price, payment, recipient, address, remarks, paid, shipped)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        new Date().toISOString(),
        JSON.stringify(order.products),
        order.price,
        JSON.stringify(order.paymentInfo),
        JSON.stringify(order.recipient),
        address,
        order.comment,
        false,
        false,
      ]
    );

    req.session.cart = [];
    res.status(201).json({ status: "ok", data: response.rows.map(mapOrderRow) });
  })
);

orderRouter.get(
  "/order/:id",
  asyncHandler(async (req, res) => {
    const orderId = parsePositiveInteger(req.params.id);

    if (orderId === null) {
      sendBadRequest(res, "訂單 ID 格式錯誤");
      return;
    }

    const order = await queryDatabase<OrderRow>(
      "SELECT * FROM orders WHERE id = $1",
      [orderId]
    );

    if (order.rowCount === 0) {
      res.status(404).json({ status: "error", message: "找不到訂單" });
      return;
    }

    res.status(200).json({ status: "ok", data: order.rows.map(mapOrderRow) });
  })
);
