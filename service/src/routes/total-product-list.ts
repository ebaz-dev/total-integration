import express, { Request, Response } from "express";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Product } from "@ebazdev/product";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../nats-wrapper";
import { BaseAPIClient } from "../shared/utils/total-api-client";
import { TotalNewProductPublisher } from "../events/publisher/total-product-recieved-publisher";

const router = express.Router();
const totalClient = new BaseAPIClient();
const totalCustomerId = process.env.TOTAL_CUSTOMER_ID;

router.get("/product-list", async (req: Request, res: Response) => {
  try {
    const totalCompanies = ["TotalDistribution"];

    const productsResponse = await totalClient.post(
      "/api/ebazaar/getdataproductinfo",
      { company: "TotalDistribution" }
    );

    const products = productsResponse?.data?.data || [];
    const total = products.length;

    const productIds = products.map((item: any) => item.productid);

    const existingProducts = await Product.find({
      "thirdPartyData.productId": { $in: productIds },
    });

    const existingProductIds = existingProducts
      .map((item) => {
        if (Array.isArray(item.thirdPartyData)) {
          const colaIntegrationData = item.thirdPartyData.find((data: any) => {
            return data?.customerId?.toString() === totalCustomerId;
          });
          return colaIntegrationData?.productId;
        }
        return undefined;
      })
      .filter(
        (productId: string | undefined): productId is string => !!productId
      );

    const newProducts = products.filter(
      (item: any) => !existingProductIds.includes(item.productid)
    );

    for (const newProduct of newProducts) {
      await new TotalNewProductPublisher(natsWrapper.client).publish({
        productId: newProduct.productid,
        productName: newProduct.productname,
        sectorName: newProduct.sectorname,
        brandName: newProduct.brandname,
        categoryName: newProduct.categoryname,
        packageName: newProduct.packagename,
        capacity: newProduct.capacity,
        incase: newProduct.incase,
        barcode: newProduct.barcode,
      });
    }

    res.status(StatusCodes.OK).send({
      data: products,
      total,
      totalPages: 1,
      currentPage: 1,
    });
  } catch (error: any) {
    console.error("Cola integration product list get error:", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong.",
    });
  }
});

export { router as totalProductListRouter };
