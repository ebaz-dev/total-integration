import { ObjectId } from "mongoose";

interface PromoDetails {
  promoid: number;
  promoname: string;
  startdate: string;
  enddate: string;
  tresholdquantity: number;
  promopercent: number;
  giftquantity: number;
  isactive: boolean;
  promotypeid: number;
  promotype: string;
  promotypebycode: string;
  totalProducts?: number[];
  totalGiftProducts?: number[];
  totalTradeshops?: number[];
  products: ObjectId[];
  giftProducts: ObjectId[];
  tradeshops: string[];
}

interface promoProducts {
  PromoID: number;
  Products: number[];
}

interface giftProducts {
  PromoID: number;
  GiftProducts: number[];
}

interface promoTradeshops {
  PromoID: number;
  Tradeshops: number[];
}

export { PromoDetails, promoProducts, giftProducts, promoTradeshops };
