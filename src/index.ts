import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { Client } from "pg";
dotenv.config();

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

app.get("/test", (req, res) => {
  res.send("Success connect");
});

app.get("/api/getProduct/:_category?/:_id?", async (req, res) => {
  const { _category, _id } = req.params;

  if (_category && _id) {
    try {
      const product = await db.query(
        "SELECT * FROM products WHERE category = $1 AND id = $2",
        [_category, _id]
      );

      res.status(200).json({ status: "ok", data: product.rows });
    } catch (e) {
      res
        .status(500)
        .send({ status: "error", message: "取得資料時遇到一些問題", error: e });
    }
  } else if (_category && !_id) {
    if (_category === "all") {
      try {
        const products = await db.query("SELECT * FROM products");
        res.status(200).json({ status: "ok", data: products.rows });
      } catch (e) {
        res.status(500).json({
          status: "error",
          message: "取得資料時遇到一些問題",
          error: e,
        });
      }
    } else if (
      _category === "gadget" ||
      _category === "furniture" ||
      _category === "decoration"
    ) {
      try {
        const products = await db.query(
          "SELECT * FROM products WHERE category = $1",
          [_category]
        );
        res.status(200).json({ status: "ok", data: products.rows });
      } catch (e) {
        res
          .status(500)
          .json({ status: "error", data: "取得資料時遇到一些問題", error: e });
      }
    }
  } else {
    res.status(404).json({ status: "error", message: "您所尋找的商品不存在" });
  }
});

app.get("/api/cart", async (req, res) => {
  console.log(" And session is: ", req.session.cart);

  try {
    if (!req.session.cart) {
      req.session.cart = [];
      res.status(200).json({ status: "ok", data: "購物車中沒有商品哦！" });
    } else {
      if (req.session.cart.length < 1) {
        res.status(200).json({ status: "ok", data: "購物車中沒有商品哦！" });
      } else {
        res.status(200).json({ status: "ok", data: req.session.cart });
      }
    }
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "獲取購物車資料出現錯誤請再試一次",
      error: e,
    });
  }
});

app.post("/api/cart", (req, res) => {
  const { productId, category, quantity } = req.body;

  try {
    if (!req.session.cart) {
      req.session.cart = [];
    }

    const existingItem = req.session.cart.find(
      (item) => item.productId === productId && item.category === category
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      req.session.cart.push({
        productId: productId,
        category: category,
        quantity: quantity,
      });
    }

    res.status(200).json({ status: "ok", data: req.session.cart });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "加入購物車出現錯誤請再試一次",
      error: e,
    });
  }
});

app.delete("/api/cart", (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!req.session.cart) {
      req.session.cart = [];
    }

    const deleteIndex = req.session.cart.findIndex(
      (item) => item.productId === productId
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

app.listen(8080, () => {
  console.log("Listening port 8080");
});
