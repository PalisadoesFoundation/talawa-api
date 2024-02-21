import {
  END_DATE_VALIDATION_ERROR,
  FUND_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Fund, FundraisingCampaign, User } from "../../models";
import { type InterfaceFundraisingCampaign } from "../../models/";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function enables to create a fundraisingCampaigin .
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2 .If the startDate is valid
 * 3. If the endDate is valid
 * 4. if the parent fund  exists
 * 5. If the user is authorized.
 * @returns Created fundraisingCampaign
 */

export const createFundraisingCampaign: MutationResolvers["createFundraisingCampaign"] =
  async (_parent, args, context): Promise<InterfaceFundraisingCampaign> => {
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const startDate = args.data.startDate;
    const endDate = args.data.endDate;
    // Checks whether startDate is valid.
    if (new Date(startDate) < new Date(new Date().toDateString())) {
      throw new errors.InputValidationError(
        requestContext.translate(
          START_DATE_VALIDATION_ERROR.MESSAGE,
        ).START_DATE_VALIDATION_ERROR.CODE,
        START_DATE_VALIDATION_ERROR.PARAM,
      );
    }
    // Checks whether endDate is valid.
    if (new Date(endDate) < new Date(startDate)) {
      throw new errors.InputValidationError(
        requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
        END_DATE_VALIDATION_ERROR.CODE,
        END_DATE_VALIDATION_ERROR.PARAM,
      );
    }
    const fund = await Fund.findOne({
      _id: args.data.fundId,
    }).lean();
    // Checks whether fund exists.
    if (!fund) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_NOT_FOUND_ERROR.MESSAGE),
        FUND_NOT_FOUND_ERROR.CODE,
        FUND_NOT_FOUND_ERROR.PARAM,
      );
    }
    const isUserOrgAdmin = currentUser.adminFor.some((orgId) =>
      orgId.equals(fund.organizationId),
    );
    if (!(isUserOrgAdmin || currentUser.userType === "SUPERADMIN")) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    // Creates a fundraisingCampaign.
    const campaign = await FundraisingCampaign.create({
      name: args.data.name,
      fundId: args.data.fundId,
      startDate: args.data.startDate,
      endDate: args.data.endDate,
      fundingGoal: args.data.fundingGoal,
      currency: args.data.currency,
    });

    //add campaigin to the parent fund
    await Fund.findByIdAndUpdate(
      {
        _id: args.data.fundId,
      },
      {
        $push: {
          campaigns: campaign._id,
        },
      },
    );
    return campaign;
  };
