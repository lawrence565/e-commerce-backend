import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { validate } from "../middlewares/validate.middleware";
import { OrderSchema } from "../schemas/order.schema";

const router = Router();

router.post("/", validate(OrderSchema), OrderController.createOrder);
router.get("/:id", OrderController.getOrderById);

export default router;
