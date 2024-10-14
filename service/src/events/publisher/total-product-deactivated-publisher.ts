import { Publisher } from "@ebazdev/core";
import { TotalProductDeactivatedEvent } from "../../shared/events/total-product-deactivated.event";
import { TotalProductSubjects } from "../../shared/events/total-product-event-subjects";

export class TotalProductDeactivatedEventPublisher extends Publisher<TotalProductDeactivatedEvent> {
  subject: TotalProductSubjects.TotalProductDeactivated =
    TotalProductSubjects.TotalProductDeactivated;
}
