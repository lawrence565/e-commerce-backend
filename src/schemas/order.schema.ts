import { z } from "zod";
import { CartItemSchema } from "./cart.schema";

const RecipientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

const ShippmentInfoSchema = z.object({
  city: z.string().min(1),
  district: z.string().min(1),
  road: z.string().min(1),
  detail: z.string(),
});

// Only storing payment token information now, NOT PAN (card numbers)
const PaymentInfoSchema = z.object({
  payment_method: z.enum(["credit_card", "atm_transfer"]),
  payment_token: z.string().optional(), // Token from Stripe/TapPay/ECPay
  payment_status: z.enum(["pending", "paid", "failed"]).default("pending"),
});

// agent:schema — OrderInput
export const OrderSchema = z.object({
  products: z.array(CartItemSchema),
  price: z.number().positive(),
  recipient: RecipientSchema,
  shippment: ShippmentInfoSchema,
  paymentInfo: PaymentInfoSchema,
  comment: z.string().optional(),
});
