import { TotalProductSubjects } from "./total-product-event-subjects";

export interface TotalProductRecievedEvent {
  subject: TotalProductSubjects.TotalProductRecieved;
  data: {
    productId: string;
    productName: string;
    sectorName: string;
    brandName: string;
    categoryName: string;
    packageName: string;
    flavorName: string;
    capacity?: number;
    incase: number;
    barcode: string;
  };
}
