import { TotalProductSubjects } from "./total-product-event-subjects";

export interface TotalProductUpdatedEvent {
  subject: TotalProductSubjects.TotalProductUpdated;
  data: {
    productId: string;
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
