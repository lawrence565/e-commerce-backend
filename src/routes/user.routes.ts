import { Router } from "express";

import { queryDatabase } from "../db/client.js";
import type { OrderRow } from "../db/rows.js";
import { userProfileSchema } from "../schemas/api.schemas.js";
import type { UserProfile } from "../types/domain.js";
import { asyncHandler } from "../utils/http.js";
import { mapOrderRow } from "../utils/mappers.js";

const defaultProfile: UserProfile = {
  name: "王小明",
  birthday: "1980/10/10",
  email: "higoogle@google.com",
  phone: "0912345678",
  addresses: [
    {
      city: "台北市",
      district: "中正區",
      road: "重慶南路一段",
      detail: "122號",
    },
  ],
};

export const userRouter = Router();

userRouter.get("/profile", (req, res) => {
  res.status(200).json({
    status: "ok",
    data: req.session.profile ?? defaultProfile,
  });
});

userRouter.put("/profile", (req, res) => {
  req.session.profile = userProfileSchema.parse(req.body);
  res.status(200).json({ status: "ok", data: req.session.profile });
});

userRouter.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await queryDatabase<OrderRow>(
      "SELECT * FROM orders ORDER BY order_date DESC LIMIT 20"
    );
    res.status(200).json({ status: "ok", data: orders.rows.map(mapOrderRow) });
  })
);
