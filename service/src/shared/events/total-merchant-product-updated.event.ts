import { TotalProductSubjects } from "./total-product-event-subjects";
import mongoose from "mongoose";

export interface TotalMerchantProductUpdated {
  subject: TotalProductSubjects.TotalMerchantProductUpdated;

  data: {
    merchantId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    activeList: string[];
    inActiveList: string[];
  };
}
