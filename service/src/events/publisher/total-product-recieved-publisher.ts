import { Publisher } from "@ebazdev/core";
import { TotalProductRecievedEvent } from "../../shared/events/total-product-recieved.event";
import { TotalProductSubjects } from "../../shared/events/total-product-event-subjects";

export class TotalProductRecievedEventPublisher extends Publisher<TotalProductRecievedEvent> {
  subject: TotalProductSubjects.TotalProductRecieved =
    TotalProductSubjects.TotalProductRecieved;
}
