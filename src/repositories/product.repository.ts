import { queryDatabase } from "../config/database";
import { Product } from "../types/product.types";

interface ProductQueryParams {
  category?: string;
  id?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export class ProductRepository {
  static async getProducts(
    paramsObj: ProductQueryParams
  ): Promise<{ products: Product[]; total: number }> {
    const {
      category,
      id,
      page = 1,
      limit = 20,
      sort = "id",
      order = "asc",
    } = paramsObj;

    let query = "SELECT * FROM products";
    let countQuery = "SELECT COUNT(*) FROM products";
    const params: unknown[] = [];
    let paramIndex = 1;

    // Filtering
    if (category && id) {
      query += ` WHERE category = $${paramIndex} AND id = $${paramIndex + 1}`;
      countQuery += ` WHERE category = $${paramIndex} AND id = $${paramIndex + 1}`;
      params.push(category, id);
      paramIndex += 2;
    } else if (category && category !== "all") {
      query += ` WHERE category = $${paramIndex}`;
      countQuery += ` WHERE category = $${paramIndex}`;
      params.push(category);
      paramIndex += 1;
    }

    // Validation for sort column to prevent SQL injection
    const validSortColumns = ["id", "price", "title"];
    const sortColumn = validSortColumns.includes(sort) ? sort : "id";
    const sortOrder = order === "desc" ? "DESC" : "ASC";

    // Sorting
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      queryDatabase(query, params),
      queryDatabase(countQuery, params.slice(0, paramIndex - 1)), // Only pass filter params
    ]);

    const countRow = countResult.rows[0] as { count: string };

    return {
      products: result.rows as Product[],
      total: parseInt(countRow.count, 10),
    };
  }
}
