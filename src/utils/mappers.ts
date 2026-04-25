import type { OrderRow, ProductRow } from "../db/rows.js";
import type { OrderResponse, Product } from "../types/domain.js";

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    description: row.description,
  };
}

export function mapOrderRow(row: OrderRow): OrderResponse {
  const recipient = row.recipient ?? {};

  return {
    id: row.id,
    orderDate: row.order_date,
    products: row.products ?? [],
    price: Number(row.price),
    paymentInfo: row.payment ?? {},
    recipient: {
      name: recipient.name ?? "",
      phone: recipient.phone ?? "",
      email: recipient.email ?? "",
    },
    shippment: {
      city: "",
      district: "",
      road: "",
      detail: row.address ?? "",
    },
    comment: row.remarks ?? "",
  };
}
