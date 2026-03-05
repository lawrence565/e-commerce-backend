import { queryDatabase } from "../config/database";
import { Product } from "../types/product.types";

export class ProductRepository {
  static async getProducts(category?: string, id?: string): Promise<Product[]> {
    let query = "SELECT * FROM products";
    const params: unknown[] = [];

    if (category && id) {
      query += " WHERE category = $1 AND id = $2";
      params.push(category, id);
    } else if (category && category !== "all") {
      query += " WHERE category = $1";
      params.push(category);
    }

    const result = await queryDatabase(query, params);
    return result.rows as Product[];
  }
}
