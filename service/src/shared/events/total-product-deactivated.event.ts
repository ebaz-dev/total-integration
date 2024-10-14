import { TotalProductSubjects } from "./total-product-event-subjects";
import { Types } from "mongoose";
export interface TotalProductDeactivatedEvent {
  subject: TotalProductSubjects.TotalProductDeactivated;
  data: {
    productId: Types.ObjectId;
  };
}
