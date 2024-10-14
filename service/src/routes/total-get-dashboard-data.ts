import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BaseAPIClient } from "../shared/utils/total-api-client";
import { BadRequestError, NotFoundError } from "@ebazdev/core";
import { Merchant } from "@ebazdev/customer";

const router = express.Router();
const totalClient = new BaseAPIClient();

const fetchDataFromTotalAPI = async (endpoint: string, body: object) => {
  try {
    const response = await totalClient.post(endpoint, body);
    return response?.data?.data ?? [];
  } catch (error: any) {
    if (
      error.response?.status === 404 ||
      error.response?.data?.err_msg === "no data"
    ) {
      return [];
    }
    throw error;
  }
};

router.get("/dashboard-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopId, customerType } = req.query;
    if (!tradeshopId || !customerType) {
      throw new BadRequestError("Required inputs are missing");
    }

    const merchant = await Merchant.findById(tradeshopId);

    if (!merchant) {
      throw new NotFoundError();
    }

    if (!merchant.tradeShops) {
      throw new BadRequestError("Total merchant not registered");
    }

    const integrationData = merchant.tradeShops;
    const totalId = integrationData.find(
      (item) => item.holdingKey === "TD"
    )?.tsId;

    if (!totalId) {
      throw new BadRequestError("Total merchant not registered");
    }

    const [orderList, discountList, salesPerformance, coolerList] =
      await Promise.all([
        fetchDataFromTotalAPI("/api/ebazaar/getdatasales", {
          tradeshopid: totalId,
          company: "TotalDistribution",
        }),
        fetchDataFromTotalAPI("/api/ebazaar/getdatadiscount", {
          tradeshopid: totalId,
          company: "TotalDistribution",
        }),
        fetchDataFromTotalAPI("/api/ebazaar/getdatared", {
          tradeshopid: totalId,
        }),
        fetchDataFromTotalAPI("/api/ebazaar/getdatacooler", {
          tradeshopid: totalId,
          customerType: "Орон нутаг",
        }),
      ]);
    const data = {
      orderList,
      discountList,
      salesPerformance,
      coolerList,
    };

    return res.status(StatusCodes.OK).send(data);
  } catch (error: any) {
    if (error.message === "Required inputs are missing") {
      throw error;
    } else if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    } else {
      console.error("Total integration dashboard list get error:", error);
      throw new BadRequestError("Something went wrong");
    }
  }
});

export { router as totalDashboardRouter };
