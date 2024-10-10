import { Publisher } from "@ebazdev/core";
import { TotalNewProductEvent } from "../../shared/events/total-product-recieved.event";
import { TotalProductSubjects } from "../../shared/events/total-product-event-subjects";

export class TotalNewProductPublisher extends Publisher<TotalNewProductEvent> {
  subject: TotalProductSubjects.NewProductFound =
    TotalProductSubjects.NewProductFound;
}
