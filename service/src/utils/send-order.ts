import { HoldingSupplierCodes, Merchant, Supplier } from "@ebazdev/customer";
import { Order, OrderStatus, PaymentMethods } from "@ebazdev/order";
import axios from "axios";
import { getTotalToken } from "./get-token";
import moment from "moment";
import { Types } from "mongoose";

const sendOrder = async (orderId: string) => {
  try {
    const { TOTAL_BASE_URI } =
      process.env.NODE_ENV === "development" ? process.env : process.env;

    if (!TOTAL_BASE_URI) {
      throw new Error("Send total order: total credentials are missing.");
    }

    const order = await Order.findById(new Types.ObjectId(orderId));

    if (!order) {
      console.log("Order not found");
      throw new Error("Order not found");
    }

    if (
      order.status === OrderStatus.Created &&
      order.paymentMethod != PaymentMethods.Cash
    ) {
      return { order };
    }
    const supplier = await Supplier.findById(order.merchantId);

    if (!supplier) {
      console.log("Supplier not found");
      throw new Error("Supplier not found");
    }

    if (supplier.holdingKey !== HoldingSupplierCodes.TotalDistribution) {
      console.log("Supplier is not TD");
      throw new Error("Supplier is not TD");
    }

    const merchant = await Merchant.findById(order.merchantId);

    console.log("merchant", merchant);

    if (!merchant) {
      console.log("Merchant not found");
      throw new Error("Merchant not found");
    }

    const tradeshop = merchant.tradeShops?.find(
      (ts) => ts.holdingKey === HoldingSupplierCodes.TotalDistribution
    );

    if (!tradeshop) {
      console.log("Tradeshop not found");
      throw new Error("Tradeshop not found");
    }

    const token = await getTotalToken();

    const getOrderNoData = {
      tradeshopid: Number(tradeshop.tsId),
      deliverydate: moment(order.deliveryDate).format("YYYY-MM-DD"),
      paymenttype:
        order.paymentMethod === PaymentMethods.Cash ? "Бэлэн" : "QPAY",
      ordertype: "bazaar",
      description: order.orderNo?.toString(),
      yourorderno: `${order.orderNo}`,
      company: "Coca Cola",
      shatlal: "no",
      businesstype: "Coca Cola", //ag_nonfood , mg_food, mg_nonfood
    };
    if (!order.thirdPartyId) {
      const getOrderNoResponse = await axios.post(
        `${TOTAL_BASE_URI}/api/ebazaar/getorderno`,
        getOrderNoData,
        {
          headers: { Authorization: `Bearer ${token}` },
          maxBodyLength: Infinity,
        }
      );
      if (
        !getOrderNoResponse.data ||
        !getOrderNoResponse.data.data[0].orderno
      ) {
        throw new Error("Get order no: error");
      }

      order.thirdPartyId = getOrderNoResponse.data.data[0].orderno;
      await order.save();
    }

    const orderDetails = order.products
      .concat(order.giftProducts)
      .map((product) => {
        return {
          orderno: order.thirdPartyId,
          productid: Number(product.thirdPartyData[0].productId),
          quantity: Number(product.quantity) + Number(product.giftQuantity),
          price: Number(product.price),
          baseprice: Number(product.basePrice),
          promoid: product.promoId || 0,
        };
      });

    const res = await axios.post(
      `${TOTAL_BASE_URI}/api/ebazaar/orderdetailcreate`,
      orderDetails,
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );
    return { totalOrderNo: order.thirdPartyId, orderDetails };
  } catch (error) {
    console.log("err", error);
    throw new Error("Send order: error");
  }
};

export { sendOrder };
