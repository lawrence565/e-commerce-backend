import { ProductRepository } from "../repositories/product.repository";
import { Product } from "../types/product.types";

export class ProductService {
  static async getProducts(category?: string, id?: string): Promise<Product[]> {
    return await ProductRepository.getProducts(category, id);
  }
}
