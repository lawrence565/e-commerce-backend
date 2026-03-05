import { queryDatabase } from "../config/database";
import { Order } from "../types/order.types";

export class OrderRepository {
  static async createOrder(order: Order, date: string, address: string) {
    const query = `
      INSERT INTO orders (order_date, products, price, payment_method, payment_token, payment_status, recipient, address, remarks, paid, shipped)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
    const params = [
      date,
      JSON.stringify(order.products),
      order.price,
      order.paymentInfo.payment_method,
      order.paymentInfo.payment_token || null,
      order.paymentInfo.payment_status || "pending",
      JSON.stringify(order.recipient),
      address,
      order.comment,
      false,
      false,
    ];

    const result = await queryDatabase(query, params);
    return result.rows as Order[];
  }

  static async getOrderById(id: string): Promise<Order[]> {
    const result = await queryDatabase("SELECT * FROM orders WHERE id = $1", [
      id,
    ]);
    return result.rows as Order[];
  }
}
