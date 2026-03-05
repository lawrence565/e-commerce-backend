import { CartItem } from "../types/cart.types";

export class CartService {
  static mergeCarts(
    cookieCart: CartItem[],
    sessionCart: CartItem[]
  ): CartItem[] {
    const mergedCart = [...cookieCart];

    sessionCart.forEach((sessionItem) => {
      const index = mergedCart.findIndex(
        (item) => item.productId === sessionItem.productId
      );

      if (index !== -1) {
        // If product found, use the larger quantity
        if (mergedCart[index].quantity < sessionItem.quantity) {
          mergedCart[index].quantity = sessionItem.quantity;
        }
      } else {
        mergedCart.push(sessionItem);
      }
    });

    return mergedCart;
  }
}
