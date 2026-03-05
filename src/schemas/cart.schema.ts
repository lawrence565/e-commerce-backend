import { z } from "zod";

// agent:schema — CartItemInput { productId: number, category: string, quantity: number(min:1) }
export const CartItemSchema = z.object({
  productId: z.number().int().positive(),
  category: z.string().min(1),
  quantity: z.number().int().positive().min(1),
});

export const UpdateCartItemSchema = z.object({
  data: z.object({
    id: z.number().int().positive(),
    newQty: z.number().int().positive().min(1),
  }),
});

// Using z.array for the cookie cart update
export const CookieCartSchema = z.array(CartItemSchema);
