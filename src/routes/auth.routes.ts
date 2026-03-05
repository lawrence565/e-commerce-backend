import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema";

const router = Router();

/**
 * @openapi
 * /register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already in use or validation failed
 */
// agent:route — POST /api/register — Registers a new customer
router.post("/register", validate(RegisterSchema), AuthController.register);

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user and receive HTTPOnly cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: accessToken
 *             schema:
 *               type: string
 *       401:
 *         description: Invalid credentials
 */
// agent:route — POST /api/login — Authenticates user and sets HTTPOnly JWT cookie
router.post("/login", validate(LoginSchema), AuthController.login);

export default router;
