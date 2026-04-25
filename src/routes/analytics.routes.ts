import { Router } from "express";

export const analyticsRouter = Router();

analyticsRouter.post("/vitals", (req, res) => {
  console.log("Web vital received:", req.body);
  res.sendStatus(204);
});
