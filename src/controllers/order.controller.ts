import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { Order } from "../types/order.types";
import { asyncHandler } from "../utils/async-handler";

export class OrderController {
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = req.body as Order;
    const response = await OrderService.createOrder(order);

    // Clear cart after successful order
    req.session.cart = [];
    res.status(200).json({ status: "ok", data: response });
  });

  static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const order = await OrderService.getOrderById(id);
    res.status(200).json({ status: "ok", data: order });
  });
}
