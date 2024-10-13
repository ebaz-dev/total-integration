import { Publisher } from "@ebazdev/core";
import { TotalMerchantProductUpdated } from "../../shared/events/total-merchant-product-updated.event";
import { TotalProductSubjects } from "../../shared/events/total-product-event-subjects";

export class TotalMerchantProductUpdatedEventPublisher extends Publisher<TotalMerchantProductUpdated> {
  subject: TotalProductSubjects.TotalMerchantProductUpdated =
    TotalProductSubjects.TotalMerchantProductUpdated;
}
