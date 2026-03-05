import { OrderRepository } from "../repositories/order.repository";
import { Order } from "../types/order.types";

export class OrderService {
  static async createOrder(order: Order) {
    const address = `\${order.shippment.city}\${order.shippment.district}\${order.shippment.road}\${order.shippment.detail}`;
    const date = new Date().toISOString();

    return await OrderRepository.createOrder(order, date, address);
  }

  static async getOrderById(id: string) {
    return await OrderRepository.getOrderById(id);
  }
}
