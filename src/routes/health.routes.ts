import { Router } from "express";

import { queryDatabase } from "../db/client.js";
import { asyncHandler } from "../utils/http.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    await queryDatabase("SELECT 1");
    res.status(200).json({ status: "ok" });
  })
);
