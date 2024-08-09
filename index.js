"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const couponsList_json_1 = __importDefault(require("./couponsList.json"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.POSTGRES_PORT !== undefined
    ? parseInt(process.env.POSTGRES_PORT, 10)
    : undefined;
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.get("/inject", (req, res) => {
    try {
        couponsList_json_1.default.map((coupon) => {
            db.query("INSERT INTO coupon_list (id, name, discount, code, expirement) VALUES ($1, $2, $3, $4, $5)", [
                coupon.id,
                coupon.name,
                coupon.discount,
                coupon.code,
                coupon.expirement,
            ]);
        });
        res.send("finished");
    }
    catch (e) {
        console.log(e);
        res.send(e);
    }
});
app.listen(8080, () => {
    console.log("Listening port 8080");
});
