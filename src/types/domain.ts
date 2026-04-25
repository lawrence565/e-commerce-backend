export type CartItem = {
  productId: number;
  category: string;
  quantity: number;
};

export type CardInfo = {
  cardNumber: string;
  expiryMonth: number | string;
  expiryYear: number | string;
  securityCode: string;
};

export type ATMInfo = {
  bank: string;
  account: string;
  transferAccount: string;
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

export type PartialRecipient = Partial<Recipient>;

export type Order = {
  products: CartItem[];
  price: number;
  recipient: Recipient;
  shippment: ShippmentInfo;
  paymentInfo: CardInfo | ATMInfo;
  comment: string;
};

export type OrderResponse = Order & {
  id: number;
  orderDate: string;
};

export type UserProfile = {
  name: string;
  birthday: string;
  email: string;
  phone: string;
  addresses: ShippmentInfo[];
};

export type ProductInput = {
  title: string;
  name: string;
  category: string;
  price: number;
  description: string;
};

export type Product = ProductInput & {
  id: number;
};

export type MerchantStats = {
  totalSales: number;
  totalOrders: number;
  recentOrders: {
    id: number;
    customer: string;
    total: number;
    status: string;
  }[];
};
