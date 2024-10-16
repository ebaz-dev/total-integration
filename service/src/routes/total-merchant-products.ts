import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Merchant } from "@ebazdev/customer";
import { Product, ProductActiveMerchants } from "@ebazdev/product";
import { TotalMerchantProductUpdatedEventPublisher } from "../events/publisher/total-merchant-product-updated-publisher";
import { BaseAPIClient } from "../shared/utils/total-api-client";
import { natsWrapper } from "../nats-wrapper";
import { Types } from "mongoose";

const router = express.Router();
const totalClient = new BaseAPIClient();
interface RegisteredProduct {
  productId: string;
  thirdPartyId: string | null;
}

router.get("/merchant/product-list", async (req: Request, res: Response) => {
  try {
    const totalHoldingKey = process.env.TOTAL_HOLDING_KEY;
    const totalCustomerId = process.env.TOTAL_CUSTOMER_ID;

    const tsId = { $exists: true };

    const merchants = await Merchant.find({
      type: "merchant",
      tradeShops: {
        $elemMatch: { holdingKey: totalHoldingKey, tsId: tsId },
      },
    });

    if (!merchants.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: "No merchants found." });
    }

    const products = await Product.find({
      customerId: totalCustomerId,
    }).lean();

    const registeredProducts: RegisteredProduct[] = products.map((product) => ({
      productId: product._id.toString(),
      thirdPartyId:
        product.thirdPartyData?.find((data: any) =>
          data.customerId.equals(totalCustomerId)
        )?.productId || null,
    }));

    for (const merchant of merchants) {
      if (!merchant.tradeShops) {
        console.error(`No trade shops found for merchant: ${merchant.id}`);
        continue;
      }

      const tradeShop = merchant.tradeShops.find(
        (shop) => shop.holdingKey === totalHoldingKey
      );

      const totalId = tradeShop?.tsId;

      if (!totalId) continue;

      const productResponse = (
        await totalClient.post("/api/ebazaar/productremains", {
          tradeshopid: totalId,
          company: "TotalDistribution",
        })
      ).data;

      const merchantId = merchant._id as string;

      const currentActiveProducts = await ProductActiveMerchants.find({
        customerId: new Types.ObjectId(totalCustomerId),
        entityReferences: { $in: [merchantId.toString()] },
      }).select("productId");

      const currentActiveProductList = currentActiveProducts.map((item) =>
        item.productId.toString()
      );

      const activeProducts = productResponse.data;

      const activeProductIds = activeProducts.map(
        (product: any) => product.productid
      );

      const activeProductList: string[] = [];
      const inActiveProductList: string[] = [];

      registeredProducts.forEach(({ productId, thirdPartyId }) => {
        (activeProductIds.includes(thirdPartyId)
          ? activeProductList
          : inActiveProductList
        ).push(productId);
      });

      const productsToActivate = activeProductList.filter(
        (productId) => !currentActiveProductList.includes(productId)
      );

      const productsToDeactivate = inActiveProductList.filter((productId) =>
        currentActiveProductList.includes(productId)
      );

      if (productsToActivate.length || productsToDeactivate.length) {
        await new TotalMerchantProductUpdatedEventPublisher(
          natsWrapper.client
        ).publish({
          merchantId: merchant.id,
          customerId: new Types.ObjectId(totalCustomerId),
          activeList: productsToActivate,
          inActiveList: productsToDeactivate,
        });
      }
    }

    return res.status(StatusCodes.OK).json({ message: "successful" });
  } catch (error: any) {
    console.log({ "Error occured at /merchant/product-list": error });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong.",
    });
  }
});

export { router as totalMerchantProductsRouter };
