import { TotalPromoSubjects } from "./total-promo-event-subjects";

export interface TotalPromoUpdatedEvent {
  subject: TotalPromoSubjects.TotalPromoUpdated;
  data: {
    id: string;
    updatedFields: {
      name?: string;
      startDate?: string;
      endDate?: string;
      thresholdQuantity?: number;
      promoPercent?: number;
      giftQuantity?: number;
      isActive?: boolean;
      tradeshops?: number[];
      products?: string[];
      giftProducts?: string[];
    };
  };
}
