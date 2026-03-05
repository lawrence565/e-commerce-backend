export type PaymentInfo = {
  payment_method: "credit_card" | "atm_transfer";
  payment_token?: string;
  payment_status: "pending" | "paid" | "failed";
};

export type ShippmentInfo = {
  city: string;
  district: string;
  road: string;
  detail: string;
};

export type Recipient = {
  name: string;
  phone: string;
  email: string;
};

export type Order = {
  products: import("./cart.types").CartItem[];
  price: number;
  recipient: Recipient;
  shippment: ShippmentInfo;
  paymentInfo: PaymentInfo;
  comment?: string;
};
