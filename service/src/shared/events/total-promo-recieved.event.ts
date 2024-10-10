import { ObjectId } from "mongoose";
import { TotalPromoSubjects } from "./total-promo-event-subjects";

export interface TotalPromoRecievedEvent {
  subject: TotalPromoSubjects.TotalPromoRecieved;

  data: {
    name: string;
    customerId: string;
    startDate: string;
    endDate: string;
    thresholdQuantity: number;
    promoPercent: number;
    giftQuantity: number;
    isActive: boolean;
    tradeshops: number[];
    products: ObjectId[];
    giftProducts: ObjectId[];
    thirdPartyPromoId: number;
    thirdPartyPromoTypeId: number;
    thirdPartyPromoType: string;
    thirdPartyPromoTypeCode: string;
    totalProducts: number[];
    totalGiftProducts: number[];
    totalTradeshops: number[];
  };
}
