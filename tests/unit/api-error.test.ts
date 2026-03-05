import { describe, it, expect } from "vitest";
import { ApiError } from "../../src/utils/api-error";

describe("ApiError", () => {
  it("should set properties correctly when instantiated", () => {
    const error = new ApiError(404, "Not Found");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not Found");
    expect(error.isOperational).toBe(true);
  });

  it("should allow overriding isOperational flag", () => {
    const error = new ApiError(500, "Internal Server Error", false);

    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Internal Server Error");
    expect(error.isOperational).toBe(false);
  });
});
