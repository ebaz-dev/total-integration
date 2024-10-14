import { Publisher } from "@ebazdev/core";
import { TotalProductUpdatedEvent } from "../../shared/events/total-product-updated.event";
import { TotalProductSubjects } from "../../shared/events/total-product-event-subjects";

export class TotalProductUpdatedEventPublisher extends Publisher<TotalProductUpdatedEvent> {
  subject: TotalProductSubjects.TotalProductUpdated =
    TotalProductSubjects.TotalProductUpdated;
}
