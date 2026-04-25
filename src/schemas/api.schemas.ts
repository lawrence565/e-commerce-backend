import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  category: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

export const cartItemsSchema = z.array(cartItemSchema);

const cardInfoSchema = z.object({
  cardNumber: z.string().trim().min(1),
  expiryMonth: z.union([z.number().int(), z.string().trim().min(1)]),
  expiryYear: z.union([z.number().int(), z.string().trim().min(1)]),
  securityCode: z.string().trim().min(1),
});

const atmInfoSchema = z.object({
  bank: z.string().trim().min(1),
  account: z.string().trim().min(1),
  transferAccount: z.string().trim().min(1),
});

export const shipmentInfoSchema = z.object({
  city: z.string().trim().min(1),
  district: z.string().trim().min(1),
  road: z.string().trim().min(1),
  detail: z.string().trim().min(1),
});

export const recipientSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export const orderSchema = z.object({
  products: cartItemsSchema,
  price: z.coerce.number().nonnegative(),
  recipient: recipientSchema,
  shippment: shipmentInfoSchema,
  paymentInfo: z.union([cardInfoSchema, atmInfoSchema]),
  comment: z.string().max(500).optional().default(""),
});

export const productInputSchema = z.object({
  title: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
  description: z.string().trim().min(1),
});

export const userProfileSchema = z.object({
  name: z.string().trim().min(1),
  birthday: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  addresses: z.array(shipmentInfoSchema),
});

export const updateCartQuantitySchema = z.object({
  data: z.object({
    newQty: z.coerce.number().int().positive(),
  }),
});
