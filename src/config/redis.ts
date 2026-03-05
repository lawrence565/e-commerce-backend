import Redis from "ioredis";
import { config } from "./index";
import { logger } from "../utils/logger";

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true,
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Connected to Redis");
  } catch (error) {
    logger.error(error, "Failed to connect to Redis");
    // Don't exit process, app might still function without cache (though session fails)
  }
};

redisClient.on("error", (error) => {
  logger.error(error, "Redis connection error");
});
