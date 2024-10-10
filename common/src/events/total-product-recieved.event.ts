import { TotalProductSubjects } from "./total-product-event-subjects";

export interface TotalNewProductEvent {
  subject: TotalProductSubjects.NewProductFound;
  data: {
    productId: string;
    productName: string;
    sectorName: string;
    brandName: string;
    categoryName: string;
    packageName: string;
    capacity: string;
    incase: number;
    barcode: string;
  };
}
