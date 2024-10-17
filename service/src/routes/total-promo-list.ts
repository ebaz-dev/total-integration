import express, { Request, Response } from "express";
import { Product, ProductDoc, Promo } from "@ebazdev/product";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../nats-wrapper";
import {
  PromoDetails,
  promoProducts,
  giftProducts,
  promoTradeshops,
} from "../shared/models/total-promo";
import { BaseAPIClient } from "../shared/utils/total-api-client";
import { TotalPromoPublisher } from "../events/publisher/total-promo-recieved-publisher";
import { TotalPromoUpdatedPublisher } from "../events/publisher/total-promo-updated-publisher";

const router = express.Router();
const totalClient = new BaseAPIClient();
const totalCustomerId = process.env.TOTAL_CUSTOMER_ID!;

router.get("/promo-list", async (req: Request, res: Response) => {
  try {
    const promosResponse = await totalClient.post(
      "/api/ebazaar/getdatapromo",
      {}
    );

    const promoData = promosResponse?.data || {};
    const promoList: PromoDetails[] = promoData.promo_main;

    if (promoList.length === 0) {
      throw new Error("No promos found.");
    }

    const promoProducts: promoProducts[] = promoData.promo_products || [];
    const giftProducts: giftProducts[] = promoData.promo_giftproducts || [];
    const promoTradeshops: promoTradeshops[] = promoData.promo_tradeshops || [];

    for (const promo of promoList) {
      const matchProducts = promoProducts.find(
        (p) => p.PromoID === promo.promoid
      );

      const matchGiftProducts = giftProducts.find(
        (p) => p.PromoID === promo.promoid
      );

      const matchTradeshops = promoTradeshops.find(
        (p) => p.PromoID === promo.promoid
      );

      promo.totalProducts = matchProducts ? matchProducts.Products : [];
      promo.totalGiftProducts = matchGiftProducts
        ? matchGiftProducts.GiftProducts
        : [];
      promo.totalTradeshops = matchTradeshops ? matchTradeshops.Tradeshops : [];

      promo.products = await fetchEbazaarProductIds(promo.totalProducts);
      promo.giftProducts = await fetchEbazaarProductIds(
        promo.totalGiftProducts
      );

      const existingPromo = await Promo.findOne({
        "thirdPartyData.thirdPartyPromoId": promo.promoid,
      });

      if (existingPromo && promo.promotypebycode) {
        const updatedFields = getUpdatedFields(existingPromo, promo);

        if (Object.keys(updatedFields).length > 0) {
          await new TotalPromoUpdatedPublisher(natsWrapper.client).publish({
            id: existingPromo.id.toString(),
            updatedFields,
          });
        }
      } else {
        if (
          (promo.products.length > 0 || promo.giftProducts.length > 0) &&
          promo.promotypebycode
        ) {
          await new TotalPromoPublisher(natsWrapper.client).publish({
            name: promo.promoname,
            customerId: totalCustomerId,
            startDate: promo.startdate,
            endDate: promo.enddate,
            thresholdQuantity: promo.tresholdquantity,
            promoPercent: promo.promopercent ?? 0,
            giftQuantity: promo.giftquantity ?? 0,
            isActive: promo.isactive,
            tradeshops: promo.totalTradeshops,
            products: promo.products,
            giftProducts: promo.giftProducts,
            thirdPartyPromoId: promo.promoid,
            thirdPartyPromoTypeId: promo.promotypeid,
            thirdPartyPromoType: promo.promotype,
            thirdPartyPromoTypeCode: promo.promotypebycode,
            totalProducts: promo.totalProducts,
            totalGiftProducts: promo.totalGiftProducts,
            totalTradeshops: promo.totalTradeshops,
          });
        }
      }
    }

    return res.status(StatusCodes.OK).send({ status: "success" });
  } catch (error: any) {
    console.error("Total integration promo list get error:", error);

    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

const fetchEbazaarProductIds = async (
  thirdPartyIds: number[]
): Promise<any> => {
  if (thirdPartyIds && thirdPartyIds.length === 0) {
    return [];
  }

  const products = (await Product.find({
    "thirdPartyData.productId": { $in: thirdPartyIds },
  }).select("_id thirdPartyData.productId")) as ProductDoc[];

  if (products.length === 0) {
    return [];
  }
  return products.map((product) => product._id);
};

const arraysEqual = (arr1: any, arr2: any) => {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    return false;
  }

  if (arr1.length !== arr2.length) {
    return false;
  }
  
  return arr1.every((value: any, index: any) => {
    return value.toString() === arr2[index].toString();
  });
};

const getUpdatedFields = (existingPromo: any, promo: any) => {
  const updatedFields: any = {};

  if (existingPromo.name !== promo.promoname) {
    updatedFields.name = promo.promoname;
  }

  if (
    existingPromo.startDate.getTime() !== new Date(promo.startdate).getTime()
  ) {
    updatedFields.startDate = promo.startdate;
  }

  if (existingPromo.endDate.getTime() !== new Date(promo.enddate).getTime()) {
    updatedFields.endDate = promo.enddate;
  }

  if (existingPromo.thresholdQuantity !== promo.tresholdquantity) {
    updatedFields.thresholdQuantity = promo.tresholdquantity;
  }

  const promoPercent = promo.promopercent ?? 0;
  if (existingPromo.promoPercent !== promoPercent) {
    updatedFields.promoPercent = promoPercent;
  }

  const giftQuantity = promo.giftquantity ?? 0;
  if (existingPromo.giftQuantity !== giftQuantity) {
    updatedFields.giftQuantity = giftQuantity;
  }

  if (existingPromo.isActive !== (promo.isactive === 1)) {
    updatedFields.isActive = promo.isactive === 1;
  }

  if (!arraysEqual(existingPromo.products, promo.products)) {
    updatedFields.products = promo.products;
  }

  if (!arraysEqual(existingPromo.giftProducts, promo.giftProducts)) {
    updatedFields.giftProducts = promo.giftProducts;
  }

  if (!arraysEqual(existingPromo.tradeshops, promo.totalTradeshops)) {
    updatedFields.tradeshops = promo.totalTradeshops;
  }

  return updatedFields;
};

export { router as totalPromoListRouter };
