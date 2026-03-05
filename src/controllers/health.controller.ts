import { Request, Response } from "express";
import { db } from "../config/database";
import { redisClient } from "../config/redis";
import { asyncHandler } from "../utils/async-handler";

export class HealthController {
  static check = asyncHandler(async (req: Request, res: Response) => {
    let dbHealthy: boolean;
    let redisHealthy: boolean;

    // Check Postgres
    try {
      const client = await db.connect();
      client.release();
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    // Check Redis
    try {
      if (redisClient.status === "ready") {
        await redisClient.ping();
        redisHealthy = true;
      } else {
        redisHealthy = false;
      }
    } catch {
      redisHealthy = false;
    }

    const status = dbHealthy && redisHealthy ? 200 : 503;

    res.status(status).json({
      status: status === 200 ? "healthy" : "unhealthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: { database: dbHealthy, redis: redisHealthy },
    });
  });
}
