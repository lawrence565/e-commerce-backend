import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const app = express();
const port =
  process.env.POSTGRES_PORT !== undefined
    ? parseInt(process.env.POSTGRES_PORT, 10)
    : undefined;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/test", (req, res) => {
  res.send("Success connect");
});

app.get("/getProduct/:_category?/:_id?", async (req, res) => {
  const { _category, _id } = req.params;
  console.log(_category, _id);

  if (_category && _id) {
    try {
      const product = await db.query(
        "SELECT * FROM products WHERE category = $1 AND id = $2",
        [_category, _id]
      );
      res.status(200).send(product.rows);
    } catch (e) {
      res.status(500).send("取得資料時遇到一些問題" + e);
    }
  } else if (_category && !_id) {
    if (_category === "all") {
      try {
        const products = await db.query("SELECT * FROM products");
        res.send(products.rows);
      } catch (e) {
        res.status(500).send("取得資料時遇到一些問題" + e);
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
        res.status(200).send(products.rows);
      } catch (e) {
        res.status(500).send("取得資料時遇到一些問題" + e);
      }
    }
  } else {
    res.status(404).send("您所前往的頁面不存在");
  }
});

app.get("/productAll", async (req, res) => {
  try {
    const products = await db.query("SELECT * FROM products");
    res.send(products.rows);
  } catch (e) {
    res.status(500).send("遇到一些問題" + e);
  }
});

app.listen(8080, () => {
  console.log("Listening port 8080");
});
