import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BaseAPIClient } from "../shared/utils/total-api-client";
import { BadRequestError, NotFoundError } from "@ebazdev/core";
import { Merchant } from "@ebazdev/customer"

const router = express.Router();
const totalClient = new BaseAPIClient();

router.get("/profile-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopId } = req.query;

    if (!tradeshopId) {
      throw new BadRequestError("tradeshopId required");
    }

    const merchant = await Merchant.findById(tradeshopId)

    if (!merchant) {
      throw new BadRequestError("merchant not found")
    }

    if (!merchant.tradeShops){
      throw new BadRequestError("cola merchant not registered")
    }

    const integrationData = merchant.tradeShops
    const totalId = integrationData.find((item) => item.holdingKey === "TD")?.tsId;
    
    if (!totalId) {
      throw new BadRequestError("cola merchant not registered")
    }

    const profileResponse = await totalClient.post(
      "/api/ebazaar/getdataprofile",
      { tradeshopid: totalId, company: "TotalDistribution" }
    );

    const profileData = profileResponse?.data?.data ?? [];

    if (profileData.length === 0) {
      throw new NotFoundError();
    }

    return res.status(StatusCodes.OK).send({ data: profileData });
  } catch (error: any) {
    if (error.response?.data?.err_msg === "no data") {
      throw new NotFoundError();
    } else if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    } else {
      console.error("Total integration get profile error:", error);
      throw new BadRequestError("Something went wrong");
    }
  }
});

export { router as totalProfileRouter };
