import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { queueGroupName } from "./queue-group-name";
import {
  SupplierCodeAddedEvent,
  CustomerEventSubjects,
} from "@ebazdev/customer";
import { BaseAPIClient } from "../../shared/utils/total-api-client";
import { Product } from "@ebazdev/product";
import { TotalMerchantProductUpdatedEventPublisher } from "../publisher/total-merchant-product-updated-publisher";
import { natsWrapper } from "../../nats-wrapper";
import { Types } from "mongoose";

const totalClient = new BaseAPIClient();
const totalCustomerId = process.env.TOTAL_CUSTOMER_ID;

interface RegisteredProduct {
  productId: string;
  thirdPartyId: string | null;
}

export class MerchantCodeRegisteredListener extends Listener<SupplierCodeAddedEvent> {
  readonly subject = CustomerEventSubjects.SupplierCodeAdded;
  queueGroupName = queueGroupName;

  async onMessage(data: SupplierCodeAddedEvent["data"], msg: Message) {
    try {
      const { merchantId, holdingKey, tsId } = data;

      if (holdingKey === "TD") {
        const productResponse = (
          await totalClient.post("/api/ebazaar/productremains", {
            tradeshopid: tsId,
          })
        ).data;

        const activeProducts = productResponse.data;

        if (activeProducts.length === 0) {
          msg.ack();
          return;
        }

        const activeProductIds = activeProducts.map(
          (product: any) => product.productid
        );

        const products = await Product.find({
          customerId: totalCustomerId,
        }).lean();

        const registeredProducts: RegisteredProduct[] = products.map(
          (product) => ({
            productId: product._id.toString(),
            thirdPartyId:
              product.thirdPartyData?.find((data: any) =>
                data.customerId.equals(totalCustomerId)
              )?.productId || null,
          })
        );

        const activeProductList: string[] = registeredProducts
          .filter(({ thirdPartyId }) => activeProductIds.includes(thirdPartyId))
          .map(({ productId }) => productId);

        await new TotalMerchantProductUpdatedEventPublisher(
          natsWrapper.client
        ).publish({
          merchantId: new Types.ObjectId(merchantId),
          customerId: new Types.ObjectId(totalCustomerId),
          activeList: activeProductList,
          inActiveList: [],
        });

        msg.ack();
      }
    } catch (error) {
      console.error("Error processing MerchantCodeRegisteredListener:", error);
    }
  }
}
