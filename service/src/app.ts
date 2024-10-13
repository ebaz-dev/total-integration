import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { errorHandler, NotFoundError, currentUser } from "@ebazdev/core";
import { healthRouter } from "./routes/health";
import { totalProductListRouter } from "./routes/total-product-list";
import { totalPromoListRouter } from "./routes/total-promo-list";
import { totalMerchantProductsRouter } from "./routes/total-merchant-products";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

dotenv.config();

const apiPrefix = "/api/v1/integration/total";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(apiPrefix, healthRouter);
app.use(apiPrefix, totalProductListRouter);
app.use(apiPrefix, totalPromoListRouter);
app.use(apiPrefix, totalMerchantProductsRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
