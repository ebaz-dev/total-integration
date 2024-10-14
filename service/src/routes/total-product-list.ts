import express, { Request, Response } from "express";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Product } from "@ebazdev/product";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../nats-wrapper";
import { BaseAPIClient } from "../shared/utils/total-api-client";
import { TotalProductRecievedEventPublisher } from "../events/publisher/total-product-recieved-publisher";
import { TotalProductDeactivatedEventPublisher } from "../events/publisher/total-product-deactivated-publisher";
import { TotalProductUpdatedEventPublisher } from "../events/publisher/total-product-updated-publisher";
import { Types } from "mongoose";

const router = express.Router();
const totalClient = new BaseAPIClient();

const totalCustomerId = process.env.TOTAL_CUSTOMER_ID;
const TotalDistribution = ["TotalDistribution"];

interface ProductData {
  productid: string;
  productname: string;
  sectorname: string;
  brandname: string;
  categoryname: string;
  packagename: string;
  flavorname: string;
  capacity: string;
  incase: number;
  barcode: string;
  business: string;
}

async function convertCapacityToInteger(
  capacity: string
): Promise<number | string> {
  if (capacity.endsWith("ml")) {
    return parseInt(capacity.replace("ml", ""), 10);
  } else if (capacity.endsWith("L")) {
    return parseFloat(capacity.replace("L", "")) * 1000;
  } else if (!isNaN(Number(capacity))) {
    return parseFloat(capacity) * 1000;
  } else {
    return capacity;
  }
}

async function sanitizeBarcode(barcode: string): Promise<string> {
  return barcode.trim().replace(/^[\s.]+|[\s.]+$/g, "");
}

router.get("/product-list", async (req: Request, res: Response) => {
  try {
    const productsResponse = await totalClient.post(
      "/api/ebazaar/getdataproductinfo",
      { company: TotalDistribution }
    );

    const products: ProductData[] = productsResponse?.data?.data || [];
    const total = products.length;

    if (products.length === 0) {
      return res.status(StatusCodes.OK).send({
        data: [],
        total,
        totalPages: 1,
        currentPage: 1,
      });
    }

    const productIds = products.map((item: any) => item.productid);

    const existingProducts = await Product.find({
      customerId: new Types.ObjectId(totalCustomerId),
    });

    let existingIds: any = [];

    const existingProductMap = existingProducts.reduce((map, item) => {
      if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
        const totalIntegrationData = item.thirdPartyData.find(
          (data: any) => data?.customerId?.toString() === totalCustomerId
        );

        if (totalIntegrationData) {
          existingIds.push(totalIntegrationData.productId);
          map[totalIntegrationData.productId] = item;
        }
      }
      return map;
    }, {} as { [key: string]: any });

    const newProducts = productIds.filter(
      (item: any) => !Object.keys(existingProductMap).includes(item.toString())
    );

    const deactiveList = Object.keys(existingProductMap).filter((productId) => {
      const existingProduct = existingProductMap[productId];
      return (
        !productIds.includes(parseInt(productId)) &&
        existingProduct.isActive === true
      );
    });

    if (newProducts.length > 0) {
      for (const newProduct of newProducts) {
        const capacity = await convertCapacityToInteger(newProduct.capacity);
        const sanitizedBarcode = await sanitizeBarcode(newProduct.barcode);

        const eventPayload: any = {
          productId: newProduct.productid,
          productName: newProduct.productname,
          sectorName: newProduct.sectorname,
          brandName: newProduct.brandname,
          categoryName: newProduct.categoryname,
          packageName: newProduct.packagename,
          flavorName: newProduct.flavorname,
          incase: newProduct.incase,
          barcode: sanitizedBarcode,
        };

        if (typeof capacity === "number") {
          eventPayload.capacity = capacity;
        }

        await new TotalProductRecievedEventPublisher(
          natsWrapper.client
        ).publish(eventPayload);
      }
    }

    if (deactiveList.length > 0) {
      for (const deactiveProductId of deactiveList) {
        const existingProduct = existingProductMap[deactiveProductId];
        if (existingProduct) {
          await new TotalProductDeactivatedEventPublisher(
            natsWrapper.client
          ).publish({
            productId: existingProduct._id,
          });
        }
      }
    }

    for (const product of products) {
      const existingProduct = existingProductMap[product.productid];
      if (existingProduct) {
        const updatedFields: any = {};

        const capacity = await convertCapacityToInteger(product.capacity);

        const existingCapacity = existingProduct.attributes?.find(
          (attr: any) => attr.key === "size"
        )?.value;

        const sanitizedBarcode = await sanitizeBarcode(product.barcode);

        if (existingProduct.name !== product.productname) {
          updatedFields.productName = product.productname;
        }

        if (!existingProduct.brandId) {
          updatedFields.brandName = product.brandname;
        }

        if (typeof capacity === "number" && existingCapacity !== capacity) {
          updatedFields.capacity = capacity;
        }

        if (existingProduct.inCase !== product.incase) {
          updatedFields.incase = product.incase;
        }

        if (
          existingProduct.barCode !== sanitizedBarcode &&
          sanitizedBarcode !== ""
        ) {
          updatedFields.barcode = sanitizedBarcode;
        }

        if (Object.keys(updatedFields).length > 0) {
          await new TotalProductUpdatedEventPublisher(
            natsWrapper.client
          ).publish({
            productId: existingProduct._id.toString(),
            updatedFields,
          });
        }
      }
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
