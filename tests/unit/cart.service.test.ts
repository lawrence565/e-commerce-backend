import { describe, it, expect } from "vitest";
import { CartService } from "../../src/services/cart.service";
import { CartItem } from "../../src/types/cart.types";

describe("CartService", () => {
  describe("mergeCarts", () => {
    it("should merge two empty carts into an empty cart", () => {
      const result = CartService.mergeCarts([], []);
      expect(result).toEqual([]);
    });

    it("should add session items to an empty cookie cart", () => {
      const cookieCart: CartItem[] = [];
      const sessionCart: CartItem[] = [
        { productId: 1, category: "electronics", quantity: 2 },
      ];

      const result = CartService.mergeCarts(cookieCart, sessionCart);
      expect(result).toEqual([
        { productId: 1, category: "electronics", quantity: 2 },
      ]);
    });

    it("should keep cookie items if session cart is empty", () => {
      const cookieCart: CartItem[] = [
        { productId: 2, category: "books", quantity: 1 },
      ];
      const sessionCart: CartItem[] = [];

      const result = CartService.mergeCarts(cookieCart, sessionCart);
      expect(result).toEqual([
        { productId: 2, category: "books", quantity: 1 },
      ]);
    });

    it("should take the larger quantity when the same product exists in both carts", () => {
      const cookieCart: CartItem[] = [
        { productId: 1, category: "electronics", quantity: 2 },
      ];
      const sessionCart: CartItem[] = [
        { productId: 1, category: "electronics", quantity: 5 },
      ];

      const result = CartService.mergeCarts(cookieCart, sessionCart);
      expect(result).toEqual([
        { productId: 1, category: "electronics", quantity: 5 },
      ]);
    });

    it("should combine distinct products from both carts", () => {
      const cookieCart: CartItem[] = [
        { productId: 1, category: "electronics", quantity: 2 },
      ];
      const sessionCart: CartItem[] = [
        { productId: 2, category: "books", quantity: 1 },
      ];

      const result = CartService.mergeCarts(cookieCart, sessionCart);
      expect(result).toEqual([
        { productId: 1, category: "electronics", quantity: 2 },
        { productId: 2, category: "books", quantity: 1 },
      ]);
    });
  });
});
