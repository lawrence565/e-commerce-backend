import type { CartItem } from "../types/domain.js";

export function mergeCarts(
  cookieCart: CartItem[],
  sessionCart: CartItem[]
): CartItem[] {
  const mergedCart = [...cookieCart];

  sessionCart.forEach((sessionItem) => {
    const index = mergedCart.findIndex(
      (item) =>
        item.productId === sessionItem.productId &&
        item.category === sessionItem.category
    );

    if (index !== -1) {
      const existingItem = mergedCart[index];
      if (!existingItem) {
        return;
      }

      mergedCart[index] = {
        ...existingItem,
        quantity: Math.max(existingItem.quantity, sessionItem.quantity),
      };
      return;
    }

    mergedCart.push(sessionItem);
  });

  return mergedCart;
}
