import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { Client } from "pg";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { validate } from "./middlewares/validate.middleware";
import { asyncHandler } from "./utils/async-handler";
import {
  CartItemSchema,
  UpdateCartItemSchema,
  CookieCartSchema,
} from "./schemas/cart.schema";
import { OrderSchema } from "./schemas/order.schema";
import { RegisterSchema, LoginSchema } from "./schemas/auth.schema";
import { generateToken } from "./utils/jwt";
import * as argon2 from "argon2";

dotenv.config();

type CartItem = {
  productId: number;
  category: string;
  quantity: number;
};

type PaymentInfo = {
  payment_method: "credit_card" | "atm_transfer";
  payment_token?: string;
  payment_status: "pending" | "paid" | "failed";
};

type ShippmentInfo = {
  city: string;
  district: string;
  road: string;
  detail: string;
};

type Recipient = {
  name: string;
  phone: string;
  email: string;
};

type Order = {
  products: CartItem[];
  price: number;
  recipient: Recipient;
  shippment: ShippmentInfo;
  paymentInfo: PaymentInfo;
  comment?: string;
};

const app = express();
const port =
  process.env.POSTGRES_PORT !== undefined
    ? parseInt(process.env.POSTGRES_PORT, 10)
    : undefined;

// Connect to Postgres
const db = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: port,
});

db.connect()
  .then(() => {
    console.log("Connecting to Postgres");
  })
  .catch((e) => {
    console.log(e);
  });

const secret =
  process.env.SESSION_SECRET !== undefined
    ? process.env.SESSION_SECRET
    : "fallback_secret_should_not_be_used";

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1); // For rate limiter if behind a proxy
app.use(helmet());
app.use(hpp());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { status: "error", message: "請求次數過多，請稍後再試" },
});
app.use("/api/", limiter);

app.use(cookieParser(process.env.MYCOOKIESECRET));
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      httpOnly: true,
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.CORS_ORIGINS?.split(",") ?? [
  "http://localhost:5173",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

function mergeCarts(
  cookieCart: CartItem[],
  sessionCart: CartItem[]
): CartItem[] {
  const mergedCart = [...cookieCart];
  sessionCart.forEach((sessionItem) => {
    const index = mergedCart.findIndex(
      (item) => item.productId === sessionItem.productId
    );
    if (index !== -1) {
      //有找到商品便確認數量
      if (mergedCart[index].quantity < sessionItem.quantity) {
        mergedCart[index].quantity = sessionItem.quantity;
      }
    } else {
      mergedCart.push(sessionItem);
    }
  });
  return mergedCart;
}

// Utility function to handle database queries with error handling
async function queryDatabase(query: string, params: unknown[], res: Response) {
  try {
    const result = await db.query(query, params);
    return result;
  } catch (e) {
    console.error("Database query error:", e);
    res.status(500).json({
      status: "error",
      message: "資料庫操作失敗，請稍後再試",
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

// Refactor /api/getProduct/:_category?/:_id? route
app.get(
  "/api/getProduct/:_category?/:_id?",
  asyncHandler(async (req: Request, res: Response) => {
    const { _category, _id } = req.params;

    try {
      let query = "SELECT * FROM products";
      const params: unknown[] = [];

      if (_category && _id) {
        query += " WHERE category = $1 AND id = $2";
        params.push(_category, _id);
      } else if (_category && _category !== "all") {
        query += " WHERE category = $1";
        params.push(_category);
      }

      const products = await queryDatabase(query, params, res);
      res.status(200).json({ status: "ok", data: products.rows });
    } catch (e) {
      console.error("Error fetching products:", e);
    }
  })
);

// Refactor /api/cart route
app.get("/api/cart", (req: Request, res: Response) => {
  try {
    const cart = req.session.cart || [];
    res.status(200).json({ status: "ok", data: cart });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "獲取購物車資料出現錯誤，請再試一次",
      error: e,
    });
  }
});

// Refactor /api/cart POST route
app.post(
  "/api/cart",
  validate(CartItemSchema),
  (req: Request, res: Response) => {
    const { productId, category, quantity } = req.body as CartItem;

    try {
      req.session.cart = req.session.cart || [];
      const existingItem = req.session.cart.find(
        (item) => item.productId === productId && item.category === category
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        req.session.cart.push({ productId, category, quantity });
      }

      res.status(200).json({ status: "ok", data: req.session.cart });
    } catch (e) {
      res.status(500).json({
        status: "error",
        message: "加入購物車出現錯誤，請再試一次",
        error: e,
      });
    }
  }
);

// Refactor /api/cart PUT route
app.put(
  "/api/cart",
  validate(CookieCartSchema),
  (req: Request, res: Response) => {
    const cookieCart = req.body as CartItem[];
    req.session.cart = req.session.cart || [];

    try {
      const mergedCart = mergeCarts(cookieCart, req.session.cart);
      req.session.cart = mergedCart;
      res.status(200).json({ status: "ok", data: mergedCart });
    } catch (e) {
      res.status(500).json({
        status: "error",
        message: "更新購物車商品數量出現錯誤，請再試一次",
        error: e,
      });
    }
  }
);

// Refactor /api/order POST route
app.post(
  `/api/order`,
  validate(OrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const order = req.body as Order;
    const address = `${order.shippment.city}${order.shippment.district}${order.shippment.road}${order.shippment.detail}`;
    const date = new Date().toISOString();

    try {
      const query = `
      INSERT INTO orders (order_date, products, price, payment_method, payment_token, payment_status, recipient, address, remarks, paid, shipped)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
      const params = [
        date,
        JSON.stringify(order.products),
        order.price,
        order.paymentInfo.payment_method,
        order.paymentInfo.payment_token || null,
        order.paymentInfo.payment_status || "pending",
        JSON.stringify(order.recipient),
        address,
        order.comment,
        false,
        false,
      ];

      const response = await queryDatabase(query, params, res);
      req.session.cart = [];
      res.status(200).json({ status: "ok", data: response.rows });
    } catch (e) {
      console.error("Error creating order:", e);
    }
  })
);

app.put(
  "/api/cart/:id",
  validate(UpdateCartItemSchema),
  (req: Request, res: Response) => {
    const { data } = req.body as { data: { id: number; newQty: number } };
    const id = data.id,
      newQty = data.newQty;

    try {
      if (!req.session.cart) {
        req.session.cart = [];
      }

      const existingItem = req.session.cart.find(
        (item) => item.productId === id
      );

      if (existingItem) {
        existingItem.quantity = newQty;
      }

      res.status(200).json({ status: "ok", data: req.session.cart });
    } catch (e) {
      console.log(e);

      res.status(500).json({
        status: "error",
        message: "更新購物車商品數量出現錯誤，請再試一次",
        error: e,
      });
    }
  }
);

app.delete("/api/cart/:id", (req: Request, res: Response) => {
  const _id = parseInt(req.params.id);
  console.log("This time the id of the deleted item is " + _id);

  try {
    if (!req.session.cart) {
      req.session.cart = [];
    }

    const deleteIndex = req.session.cart.findIndex(
      (item) => item.productId === _id
    );
    console.log(
      "Deleting function functioning and the index of the deleted item is " +
        deleteIndex
    );

    if (deleteIndex != -1) {
      req.session.cart.splice(deleteIndex, 1);
    }

    res.status(200).json({ status: "ok", message: "成功刪除" });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "出現錯誤請再試一次",
      error: e,
    });
  }
});

app.delete("/api/carts", (req: Request, res: Response) => {
  try {
    req.session.cart = [];
    res.status(200).json({ status: "ok", message: "成功刪除" });
  } catch (e) {
    res
      .status(500)
      .json({ status: "error", message: "出現錯誤請再試一次", error: e });
  }
});

app.get(
  `/api/order/:id`,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      const order = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
      res.status(200).json({ status: "ok", data: order.rows });
    } catch (e) {
      console.log("Something happened", e);
      res.status(500).json({
        status: "error",
        message: "更新購物車商品數量出現錯誤，請再試一次",
        error: e,
      });
    }
  })
);

// Refactor /api/register POST route
app.post(
  "/api/register",
  validate(RegisterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as Record<string, string>;
    try {
      const existingUser = await queryDatabase(
        "SELECT id FROM users WHERE email = $1",
        [email],
        res
      );
      if (existingUser.rows.length > 0) {
        res.status(400).json({ status: "error", message: "該信箱已被註冊" });
        return;
      }

      const passwordHash = await argon2.hash(password);
      const result = await queryDatabase(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role",
        [email, passwordHash],
        res
      );
      const newUser = result.rows[0] as {
        id: number;
        email: string;
        role: string;
      };

      res.status(201).json({ status: "ok", data: newUser });
    } catch (e) {
      console.error("Error registering user:", e);
    }
  })
);

// Refactor /api/login POST route
app.post(
  "/api/login",
  validate(LoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as Record<string, string>;
    try {
      const result = await queryDatabase(
        "SELECT * FROM users WHERE email = $1",
        [email],
        res
      );
      const user = result.rows[0] as
        | { id: number; email: string; password_hash: string; role: string }
        | undefined;

      if (!user || !(await argon2.verify(user.password_hash, password))) {
        res.status(401).json({ status: "error", message: "信箱或密碼錯誤" });
        return;
      }

      const token = await generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Set token in HTTPOnly cookie
      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
      });

      res.status(200).json({
        status: "ok",
        data: { id: user.id, email: user.email, role: user.role },
      });
    } catch (e) {
      console.error("Error logging in user:", e);
    }
  })
);

app.listen(8080, () => {
  console.log("Listening port 8080");
});
