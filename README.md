# E-Commerce 後端服務

這是配合 [e-commerce 前端](https://github.com/lawrence565/e-commerce-demo) 的後端服務，透過 Node, express, axios, JWT 等方式建立服務，完成提供資料、購物車紀錄、付款等相關處理，使前端有後端的服務支援。

## 提供服務

在本專案中會以前端的展示為主，後端僅止於 CRUD 的簡單處理。
結合 Node.js 與 PostgreSQL 搭建的簡易的後端伺服器。在 SQL 資料庫中儲存商品、訂單、優惠券等等資料，透過伺服器抓取資料並製作簡易的 RESTful API 與前端互動。

## 使用技術

在伺服器製作中，使用 TypeScript 搭配 Node.js 製作簡易伺服器，內容只包括 CRUD 等功能。

## 後續方向

- 登入驗證，提高產品完整度，並能提供會員系統。
- 使用者與訂單連動，除了在前端畫面中呈現外也能作為會員紅利等更深度的功能前提。
- 串連金流工具如藍新、綠界等，學習如何串接金流 API

## License

Licensed under the MIT License, Copyright © 2024-present Lawrence Wu
