/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/config/database";
import { redisClient } from "../../src/config/redis";

// Mock the database and redis clients to control their behavior during tests
vi.mock("../../src/config/database", () => ({
  db: {
    connect: vi.fn(),
  },
}));

vi.mock("../../src/config/redis", () => ({
  redisClient: {
    status: "ready",
    ping: vi.fn(),
  },
}));

type HealthResponse = {
  status: string;
  checks: { database: boolean; redis: boolean };
};

describe("Integration: /health Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 healthy when both DB and Redis are up", async () => {
    // Mock successful connections
    const mockRelease = vi.fn();
    vi.mocked(db.connect).mockResolvedValue({ release: mockRelease } as never);
    vi.mocked(redisClient.ping).mockResolvedValue("PONG" as never);

    const response = await request(app).get("/health");
    const body = response.body as HealthResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database).toBe(true);
    expect(body.checks.redis).toBe(true);
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should return 503 unhealthy when DB is down", async () => {
    // Mock DB failure
    vi.mocked(db.connect).mockRejectedValue(
      new Error("DB connection failed") as never
    );
    vi.mocked(redisClient.ping).mockResolvedValue("PONG" as never);

    const response = await request(app).get("/health");
    const body = response.body as HealthResponse;

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database).toBe(false);
    expect(body.checks.redis).toBe(true);
  });

  it("should return 503 unhealthy when Redis is down", async () => {
    // Mock Redis failure
    const mockRelease = vi.fn();
    vi.mocked(db.connect).mockResolvedValue({ release: mockRelease } as never);
    vi.mocked(redisClient.ping).mockRejectedValue(
      new Error("Redis ping failed") as never
    );

    const response = await request(app).get("/health");
    const body = response.body as HealthResponse;

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database).toBe(true);
    expect(body.checks.redis).toBe(false);
  });
});
