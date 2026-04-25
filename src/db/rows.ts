import type { QueryResultRow } from "pg";

import type { ATMInfo, CardInfo, CartItem, PartialRecipient, ProductInput } from "../types/domain.js";

export type ProductRow = QueryResultRow &
  ProductInput & {
    id: number;
    price: string | number;
  };

export type OrderRow = QueryResultRow & {
  id: number;
  order_date: string;
  products: CartItem[];
  price: string | number;
  payment: CardInfo | ATMInfo;
  recipient: PartialRecipient;
  address: string;
  remarks: string | null;
  paid?: boolean;
  shipped?: boolean;
};

export type MerchantSummaryRow = QueryResultRow & {
  total_sales: string | null;
  total_orders: string;
};

export type MerchantRecentOrderRow = QueryResultRow & {
  id: number;
  price: string | number;
  recipient: PartialRecipient | null;
  paid: boolean | null;
  shipped: boolean | null;
};
