import { Types } from "mongoose";
import {
  FUNDRAISING_CAMPAIGN_ALREADY_EXISTS,
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, Fund, FundraisingCampaign, User } from "../../models";
import { type InterfaceFundraisingCampaign } from "../../models/";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { validateDate } from "../../utilities/dateValidator";
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

    const currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    // Checks whether fundraisingCampaign already exists.
    const existigngCampaign = await FundraisingCampaign.findOne({
      name: args.data.name,
    }).lean();
    if (existigngCampaign) {
      throw new errors.ConflictError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.MESSAGE),
        FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.CODE,
        FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.PARAM,
      );
    }
    const startDate = args.data.startDate;
    const endDate = args.data.endDate;

    //validates StartDate and endDate
    validateDate(startDate, endDate);

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
    const currentOrg = await Fund.findById(fund._id)
      .select("organizationId")
      .lean();

    const currentOrgId = currentOrg?.organizationId?.toString() || "";

    const currentUserIsOrgAdmin = currentUserAppProfile.adminFor.some(
      (organizationId) =>
        new Types.ObjectId(organizationId?.toString()).equals(currentOrgId),
    );
    if (
      !currentUserIsOrgAdmin ||
      currentUserAppProfile.isSuperAdmin === false
    ) {
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
    await Fund.findOneAndUpdate(
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
