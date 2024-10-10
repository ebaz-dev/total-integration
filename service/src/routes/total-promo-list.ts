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
import { TotalPromoPublisher } from "../events/publisher/total-promo-recieved-publisher"

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
      // console.log(promo.totalProducts);
      // console.log('***************************');
      promo.products = await fetchEbazaarProductIds(promo.totalProducts);
      promo.giftProducts = await fetchEbazaarProductIds(promo.totalGiftProducts);

      console.log(promo.products);
      if(promo.products.length > 0){
        console.log(promo);
      }

      const existingPromo = await Promo.findOne({
        thirdPartyPromoId: promo.promoid,
      });

      // if (existingPromo) {
        // const hasChanges =
        //   existingPromo.name !== promo.promoname ||
        //   existingPromo.startDate.getTime() !==
        //     new Date(promo.startdate).getTime() ||
        //   existingPromo.endDate.getTime() !==
        //     new Date(promo.enddate).getTime() ||
        //   existingPromo.thresholdQuantity !== promo.tresholdquantity ||
        //   existingPromo.promoPercent !== promo.promopercent ||
        //   existingPromo.giftQuantity !== promo.giftquantity ||
        //   existingPromo.isActive !== promo.isactive ||
        //   !arraysEqual(existingPromo.products, promo.products) ||
        //   !arraysEqual(existingPromo.giftProducts, promo.giftProducts) ||
        //   !arraysEqual(existingPromo.tradeshops, promo.totalTradeshops);

        // if (hasChanges) {
        //   await new TotalPromoPublisher(natsWrapper.client).publish({
        //     id: existingPromo.id.toString(),
        //     name: promo.promoname,
        //     customerId: totalCustomerId,
        //     startDate: promo.startdate,
        //     endDate: promo.enddate,
        //     thresholdQuantity: promo.tresholdquantity,
        //     promoPercent: promo.promopercent,
        //     giftQuantity: promo.giftquantity,
        //     isActive: promo.isactive,
        //     tradeshops: promo.totalTradeshops,
        //     products: promo.products,
        //     giftProducts: promo.giftProducts,
        //     thirdPartyPromoId: promo.promoid,
        //     thirdPartyPromoTypeId: promo.promotypeid,
        //     thirdPartyPromoType: promo.promotype,
        //     thirdPartyPromoTypeCode: promo.promotypebycode,
        //     totalProducts: promo.totalProducts,
        //     totalGiftProducts: promo.totalGiftProducts,
        //     totalTradeshops: promo.totalTradeshops,
        //   });
        // }
      // } else {

        // await new TotalPromoPublisher(natsWrapper.client).publish({
        //   name: promo.promoname,
        //   customerId: totalCustomerId,
        //   startDate: promo.startdate,
        //   endDate: promo.enddate,
        //   thresholdQuantity: promo.tresholdquantity,
        //   promoPercent: promo.promopercent,
        //   giftQuantity: promo.giftquantity,
        //   isActive: promo.isactive,
        //   tradeshops: promo.totalTradeshops,
        //   products: promo.products,
        //   giftProducts: promo.giftProducts,
        //   thirdPartyPromoId: promo.promoid,
        //   thirdPartyPromoTypeId: promo.promotypeid,
        //   thirdPartyPromoType: promo.promotype,
        //   thirdPartyPromoTypeCode: promo.promotypebycode,
        //   totalProducts: promo.totalProducts,
        //   totalGiftProducts: promo.totalGiftProducts,
        //   totalTradeshops: promo.totalTradeshops,
        // });
      // }
    }

    return res.status(StatusCodes.OK).send({ status: "promoList" });
  } catch (error: any) {
    console.error("Total integration product list get error:", error);

    return res.status(StatusCodes.BAD_REQUEST).send({
      satus: "failure",
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
    return []
  }
  return products.map((product) => product._id);
};

const arraysEqual = (arr1: any, arr2: any) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value: any, index: any) => {
    return value.toString() === arr2[index].toString();
  });
};

export { router as totalPromoListRouter };
