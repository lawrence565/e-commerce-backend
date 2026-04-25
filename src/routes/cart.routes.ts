import { Router } from "express";

import {
  cartItemSchema,
  cartItemsSchema,
  updateCartQuantitySchema,
} from "../schemas/api.schemas.js";
import { mergeCarts } from "../utils/cart.js";
import { parsePositiveInteger, sendBadRequest } from "../utils/http.js";

export const cartRouter = Router();

cartRouter.get("/cart", (req, res) => {
  res.status(200).json({ status: "ok", data: req.session.cart ?? [] });
});

cartRouter.post("/cart", (req, res) => {
  const cartItem = cartItemSchema.parse(req.body);

  req.session.cart = req.session.cart ?? [];
  const existingItem = req.session.cart.find(
    (item) =>
      item.productId === cartItem.productId && item.category === cartItem.category
  );

  if (existingItem) {
    existingItem.quantity += cartItem.quantity;
  } else {
    req.session.cart.push(cartItem);
  }

  res.status(200).json({ status: "ok", data: req.session.cart });
});

cartRouter.put("/cart", (req, res) => {
  const cookieCart = cartItemsSchema.parse(req.body);

  req.session.cart = mergeCarts(cookieCart, req.session.cart ?? []);
  res.status(200).json({ status: "ok", data: req.session.cart });
});

cartRouter.put("/cart/:id", (req, res) => {
  const productId = parsePositiveInteger(req.params.id);
  const { data } = updateCartQuantitySchema.parse(req.body);

  if (productId === null) {
    sendBadRequest(res, "商品 ID 格式錯誤");
    return;
  }

  req.session.cart = req.session.cart ?? [];
  const existingItem = req.session.cart.find(
    (item) => item.productId === productId
  );

  if (existingItem) {
    existingItem.quantity = data.newQty;
  }

  res.status(200).json({ status: "ok", data: req.session.cart });
});

cartRouter.delete("/cart/:id", (req, res) => {
  const productId = parsePositiveInteger(req.params.id);

  if (productId === null) {
    sendBadRequest(res, "商品 ID 格式錯誤");
    return;
  }

  req.session.cart = (req.session.cart ?? []).filter(
    (item) => item.productId !== productId
  );
  res.status(200).json({ status: "ok", message: "成功刪除" });
});

cartRouter.delete("/carts", (req, res) => {
  req.session.cart = [];
  res.status(200).json({ status: "ok", message: "成功刪除" });
});
