import { ProductRepository } from "../repositories/product.repository";
import { Product } from "../types/product.types";
import { redisClient } from "../config/redis";
import { logger } from "../utils/logger";

interface ProductQueryParams {
  category?: string;
  id?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export class ProductService {
  static async getProducts(
    params: ProductQueryParams
  ): Promise<{ products: Product[]; total: number }> {
    const cacheKey = `products:${JSON.stringify(params)}`;

    try {
      if (redisClient.status === "ready") {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          logger.debug({ cacheKey }, "Cache hit for products");
          return JSON.parse(cachedData) as {
            products: Product[];
            total: number;
          };
        }
      }
    } catch (e) {
      logger.warn(e, "Redis cache error, falling back to database");
    }

    logger.debug({ cacheKey }, "Cache miss, querying database");
    const result = await ProductRepository.getProducts(params);

    try {
      if (redisClient.status === "ready") {
        // Cache for 5 minutes
        await redisClient.set(cacheKey, JSON.stringify(result), "EX", 300);
      }
    } catch (e) {
      logger.warn(e, "Failed to set Redis cache");
    }

    return result;
  }
}
