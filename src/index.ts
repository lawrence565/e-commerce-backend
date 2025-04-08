import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { Client } from "pg";
dotenv.config();

type CartItem = {
  productId: number;
  category: string;
  quantity: number;
};

type CardInfo = {
  cardNumber: string;
  expiryMonth: number | string;
  expiryYear: number | string;
  securityCode: string;
};

type ATMInfo = {
  bank: string;
  account: string;
  transferAccount: string;
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
  products: CartItem;
  price: number;
  recipient: Recipient;
  shippment: ShippmentInfo;
  paymentInfo: CardInfo | ATMInfo;
  comment: string;
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
  process.env.SESSION_SECRET !== undefined ? process.env.SESSION_SECRET : " ";

app.use(cookieParser(process.env.MYCOOKIESECRET));
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
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
async function queryDatabase(query: string, params: any[], res: any) {
  try {
    const result = await db.query(query, params);
    return result;
  } catch (e) {
    console.error("Database query error:", e);
    res.status(500).json({
      status: "error",
      message: "資料庫操作失敗，請稍後再試",
      error: e,
    });
    throw e;
  }
}

// Refactor /api/getProduct/:_category?/:_id? route
app.get("/api/getProduct/:_category?/:_id?", async (req, res) => {
  const { _category, _id } = req.params;

  try {
    let query = "SELECT * FROM products";
    const params: any[] = [];

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
});

// Refactor /api/cart route
app.get("/api/cart", (req, res) => {
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
app.post("/api/cart", (req, res) => {
  const { productId, category, quantity } = req.body;

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
});

// Refactor /api/cart PUT route
app.put("/api/cart", (req, res) => {
  const cookieCart = req.body;
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
});

// Refactor /api/order POST route
app.post(`/api/order`, async (req, res) => {
  const order: Order = req.body;
  const address = `${order.shippment.city}${order.shippment.district}${order.shippment.road}${order.shippment.detail}`;
  const date = new Date().toISOString();

  try {
    const query = `
      INSERT INTO orders (order_date, products, price, payment, recipient, address, remarks, paid, shipped)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
    const params = [
      date,
      JSON.stringify(order.products),
      order.price,
      JSON.stringify(order.paymentInfo),
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
});

app.put("/api/cart/:id", (req, res) => {
  const { data } = req.body;
  const id = data.id,
    newQty = data.newQty;

  try {
    if (!req.session.cart) {
      req.session.cart = [];
    }

    const existingItem = req.session.cart.find((item) => item.productId === id);

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
});

app.delete("/api/cart/:id", (req, res) => {
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

app.delete("/api/carts", (req, res) => {
  try {
    req.session.cart = [];
    res.status(200).json({ status: "ok", message: "成功刪除" });
  } catch (e) {
    res
      .status(200)
      .json({ status: "error", message: "出現錯誤請再試一次", error: e });
  }
});

app.get(`/api/order/:id`, async (req, res) => {
  const id = req.params;
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
});

app.listen(8080, () => {
  console.log("Listening port 8080");
});
