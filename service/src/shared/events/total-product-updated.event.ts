import { TotalProductSubjects } from "./total-product-event-subjects";
import { Types } from "mongoose";

export interface TotalProductUpdatedEvent {
  subject: TotalProductSubjects.TotalProductUpdated;
  data: {
    productId: Types.ObjectId;
    updatedFields: {
      productName?: string;
      brandName?: string;
      packageName?: string;
      capacity?: string;
      incase?: number;
      barcode?: string;
    };
  };
}
