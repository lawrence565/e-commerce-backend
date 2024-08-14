"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const pg_1 = require("pg");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.POSTGRES_PORT !== undefined
    ? parseInt(process.env.POSTGRES_PORT, 10)
    : undefined;
// Connect to Postgres
const db = new pg_1.Client({
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
const secret = process.env.SESSION_SECRET !== undefined ? process.env.SESSION_SECRET : " ";
app.use((0, express_session_1.default)({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.get("/test", (req, res) => {
    res.send("Success connect");
});
app.get("/api/getProduct/:_category?/:_id?", async (req, res) => {
    const { _category, _id } = req.params;
    if (_category && _id) {
        try {
            const product = await db.query("SELECT * FROM products WHERE category = $1 AND id = $2", [_category, _id]);
            res.status(200).json({ status: "ok", data: product.rows });
        }
        catch (e) {
            res
                .status(500)
                .send({ status: "error", message: "取得資料時遇到一些問題", error: e });
        }
    }
    else if (_category && !_id) {
        if (_category === "all") {
            try {
                const products = await db.query("SELECT * FROM products");
                res.status(200).json({ status: "ok", data: "products.rows" });
            }
            catch (e) {
                res.status(500).json({
                    status: "error",
                    message: "取得資料時遇到一些問題",
                    error: e,
                });
            }
        }
        else if (_category === "gadget" ||
            _category === "furniture" ||
            _category === "decoration") {
            try {
                const products = await db.query("SELECT * FROM products WHERE category = $1", [_category]);
                res.status(200).json({ status: "ok", data: products.rows });
            }
            catch (e) {
                res
                    .status(500)
                    .json({ status: "error", data: "取得資料時遇到一些問題", error: e });
            }
        }
    }
    else {
        res.status(404).json({ status: "error", message: "您所尋找的商品不存在" });
    }
});
app.get("/api/cart", async (req, res) => {
    try {
        if (!req.session.cart) {
            req.session.cart = [];
            res.status(200).json({ status: "ok", message: "購物車中沒有商品哦！" });
        }
        else {
            res.status(200).json({ status: "ok", data: req.session.cart });
        }
    }
    catch (e) {
        res.status(500).json({
            status: "error",
            message: "出現錯誤請再試一次",
            error: e,
        });
    }
});
app.post("/api/cart", (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (!req.session.cart) {
            req.session.cart = [];
        }
        const existingItem = req.session.cart.find((item) => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            req.session.cart.push({ productId, quantity });
        }
        res.status(200).json({ status: "ok", data: req.session.cart });
    }
    catch (e) {
        res.status(500).json({
            status: "error",
            message: "出現錯誤請再試一次",
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
        const deleteIndex = req.session.cart.findIndex((item) => item.productId === productId);
        if (deleteIndex != -1) {
            req.session.cart.splice(deleteIndex, 1);
        }
        res.status(200).json({ status: "ok", message: "成功刪除" });
    }
    catch (e) {
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
    }
    catch (e) {
        res
            .status(200)
            .json({ status: "error", message: "出現錯誤請再試一次", error: e });
    }
});
app.listen(8080, () => {
    console.log("Listening port 8080");
});
