import { Publisher } from "@ebazdev/core";
import { TotalPromoRecievedEvent } from "../../shared/events/total-promo-recieved.event";
import { TotalPromoSubjects } from "../../shared/events/total-promo-event-subjects";

export class TotalPromoPublisher extends Publisher<TotalPromoRecievedEvent> {
  subject: TotalPromoSubjects.TotalPromoRecieved =
    TotalPromoSubjects.TotalPromoRecieved;
}
