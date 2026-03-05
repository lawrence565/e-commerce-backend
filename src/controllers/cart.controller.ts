import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { CartItem } from "../types/cart.types";

export class CartController {
  static getCart = (req: Request, res: Response): void => {
    const cart = req.session.cart || [];
    res.status(200).json({ status: "ok", data: cart });
  };

  static addItem = (req: Request, res: Response): void => {
    const { productId, category, quantity } = req.body as CartItem;
    req.session.cart = req.session.cart || [];

    const existingItem = req.session.cart.find(
      (item) => item.productId === productId && item.category === category
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      req.session.cart.push({ productId, category, quantity });
    }

    res.status(200).json({ status: "ok", data: req.session.cart });
  };

  static mergeCart = (req: Request, res: Response): void => {
    const cookieCart = req.body as CartItem[];
    req.session.cart = req.session.cart || [];

    const mergedCart = CartService.mergeCarts(cookieCart, req.session.cart);
    req.session.cart = mergedCart;

    res.status(200).json({ status: "ok", data: mergedCart });
  };

  static updateItem = (req: Request, res: Response): void => {
    const { data } = req.body as { data: { id: number; newQty: number } };
    const { id, newQty } = data;

    if (!req.session.cart) req.session.cart = [];

    const existingItem = req.session.cart.find((item) => item.productId === id);
    if (existingItem) {
      existingItem.quantity = newQty;
    }

    res.status(200).json({ status: "ok", data: req.session.cart });
  };

  static removeItem = (req: Request, res: Response): void => {
    const _id = parseInt(req.params.id);
    if (!req.session.cart) req.session.cart = [];

    const deleteIndex = req.session.cart.findIndex(
      (item) => item.productId === _id
    );

    if (deleteIndex !== -1) {
      req.session.cart.splice(deleteIndex, 1);
    }

    res.status(200).json({ status: "ok", message: "成功刪除" });
  };

  static clearCart = (req: Request, res: Response): void => {
    req.session.cart = [];
    res.status(200).json({ status: "ok", message: "成功刪除" });
  };
}
