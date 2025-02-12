"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const pg_1 = require("pg");
dotenv_1.default.config();
const decorations_json_1 = __importDefault(require("./products/decorations.json"));
const furnitures_json_1 = __importDefault(require("./products/furnitures.json"));
const gadgets_json_1 = __importDefault(require("./products/gadgets.json"));
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
for (let i = 0; i < decorations_json_1.default.length; i++) {
    db.query("INSERT INTO products (category, title, name, description, price, stock) VALUES ($1, $2, $3, $4, $5, $6)", [
        "decoration",
        decorations_json_1.default[i].title,
        decorations_json_1.default[i].name,
        decorations_json_1.default[i].content,
        decorations_json_1.default[i].price,
        100,
    ]);
}
for (let i = 0; i < furnitures_json_1.default.length; i++) {
    db.query("INSERT INTO products (category, title, name, description, price, stock) VALUES ($1, $2, $3, $4, $5, $6)", [
        "furniture",
        furnitures_json_1.default[i].title,
        furnitures_json_1.default[i].name,
        furnitures_json_1.default[i].content,
        furnitures_json_1.default[i].price,
        100,
    ]);
}
for (let i = 0; i < gadgets_json_1.default.length; i++) {
    db.query("INSERT INTO products (category, title, name, description, price, stock) VALUES ($1, $2, $3, $4, $5, $6)", [
        "gadget",
        gadgets_json_1.default[i].title,
        gadgets_json_1.default[i].name,
        gadgets_json_1.default[i].content,
        gadgets_json_1.default[i].price,
        100,
    ]);
}
const secret = process.env.SESSION_SECRET !== undefined ? process.env.SESSION_SECRET : " ";
app.use((0, cookie_parser_1.default)(process.env.MYCOOKIESECRET));
app.use((0, express_session_1.default)({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
function mergeCarts(cookieCart, sessionCart) {
    const mergedCart = [...cookieCart];
    sessionCart.forEach((sessionItem) => {
        const index = mergedCart.findIndex((item) => item.productId === sessionItem.productId);
        if (index !== -1) {
            //有找到商品便確認數量
            if (mergedCart[index].quantity < sessionItem.quantity) {
                mergedCart[index].quantity = sessionItem.quantity;
            }
        }
        else {
            mergedCart.push(sessionItem);
        }
    });
    return mergedCart;
}
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
                res.status(200).json({ status: "ok", data: products.rows });
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
            res.status(200).json({ status: "ok", data: [] });
        }
        else {
            if (req.session.cart.length < 1) {
                res.status(200).json({ status: "ok", data: [] });
            }
            else {
                res.status(200).json({ status: "ok", data: req.session.cart });
            }
        }
    }
    catch (e) {
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
        const existingItem = req.session.cart.find((item) => item.productId === productId && item.category === category);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            req.session.cart.push({
                productId: productId,
                category: category,
                quantity: quantity,
            });
        }
        res.status(200).json({ status: "ok", data: req.session.cart });
    }
    catch (e) {
        res.status(500).json({
            status: "error",
            message: "加入購物車出現錯誤請再試一次",
            error: e,
        });
    }
});
app.put("/api/cart", (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    const cookieCart = req.body;
    const sessionCart = req.session.cart;
    try {
        let mergedCart;
        if (cookieCart.length > 0 && sessionCart.length < 1) {
            req.session.cart = cookieCart;
            mergedCart = cookieCart;
        }
        else if (cookieCart.length < 1 && sessionCart.length > 0) {
            mergedCart = sessionCart;
        }
        else if (cookieCart.length > 0 && sessionCart.length > 0) {
            mergedCart = mergeCarts(cookieCart, sessionCart);
        }
        else {
            mergedCart = [];
        }
        if (mergedCart.length > 0) {
            res.status(200).json({ status: "ok", data: mergedCart });
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            status: "error",
            message: "更新購物車商品數量出現錯誤，請再試一次",
            error: e,
        });
    }
});
app.put("/api/cart/:id", (req, res) => {
    const { data } = req.body;
    const id = data.id, newQty = data.newQty;
    try {
        if (!req.session.cart) {
            req.session.cart = [];
        }
        const existingItem = req.session.cart.find((item) => item.productId === id);
        if (existingItem) {
            existingItem.quantity = newQty;
        }
        res.status(200).json({ status: "ok", data: req.session.cart });
    }
    catch (e) {
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
        const deleteIndex = req.session.cart.findIndex((item) => item.productId === _id);
        console.log("Deleting function functioning and the index of the deleted item is " +
            deleteIndex);
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
app.get(`/api/order/:id`, async (req, res) => {
    const id = req.params;
    try {
        const order = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
        res.status(200).json({ status: "ok", data: order.rows });
    }
    catch (e) {
        console.log("Something happened", e);
        res.status(500).json({
            status: "error",
            message: "更新購物車商品數量出現錯誤，請再試一次",
            error: e,
        });
    }
});
app.post(`/api/order`, async (req, res) => {
    const order = req.body;
    const address = `${order.shippment.city}${order.shippment.district}${order.shippment.road}${order.shippment.detail}`;
    const date = new Date().getDate();
    try {
        const responce = await db.query("INSERT INTO orders (order_date, products, price, payment, recipient, address, remarks, paid, shipped ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [
            date,
            JSON.stringify(order.products),
            order.price,
            JSON.stringify(order.paymentInfo),
            JSON.stringify(order.recipient),
            address,
            order.comment,
            false,
            false,
        ]);
        if (responce)
            req.session.cart = [];
        res.status(200).json({ status: "ok", data: responce.rows });
    }
    catch (e) {
        console.log(e);
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
