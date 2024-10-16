import { Publisher } from "@ebazdev/core";
import { TotalPromoUpdatedEvent } from "../../shared/events/total-promo-updated.event";
import { TotalPromoSubjects } from "../../shared/events/total-promo-event-subjects";

export class TotalPromoUpdatedPublisher extends Publisher<TotalPromoUpdatedEvent> {
  subject: TotalPromoSubjects.TotalPromoUpdated =
    TotalPromoSubjects.TotalPromoUpdated;
}
