import {
  FUNDRAISING_CAMPAIGN_ALREADY_EXISTS,
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, Fund, FundraisingCampaign, User } from "../../models";
import { type InterfaceFundraisingCampaign } from "../../models/";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { validateDate } from "../../utilities/dateValidator";

/**
 * Creates a new fundraising campaign and associates it with a specified fund.
 *
 * This resolver performs the following actions:
 *
 * 1. Validates the existence of the current user.
 * 2. Checks if the user has an associated profile and if they are authorized.
 * 3. Ensures that a fundraising campaign with the same name does not already exist.
 * 4. Validates the provided start and end dates for the campaign.
 * 5. Verifies the existence of the specified fund and checks if the user is authorized to create a campaign for the fund.
 * 6. Creates a new fundraising campaign and associates it with the fund.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *     - `name`: The name of the fundraising campaign.
 *     - `fundId`: The ID of the fund to associate the campaign with.
 *     - `startDate`: The start date of the campaign.
 *     - `endDate`: The end date of the campaign.
 *     - `fundingGoal`: The funding goal for the campaign.
 *     - `currency`: The currency for the funding goal.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns A promise that resolves to the created fundraising campaign object.
 *
 * @remarks This function checks the cache for user and profile data, validates inputs, and ensures the user has the necessary permissions before creating the campaign.
 */
export const createFundraisingCampaign: MutationResolvers["createFundraisingCampaign"] =
  async (_parent, args, context): Promise<InterfaceFundraisingCampaign> => {
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    let currentUserAppProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentUserAppProfile = appUserProfileFoundInCache[0];
    if (currentUserAppProfile === null) {
      currentUserAppProfile = await AppUserProfile.findOne({
        userId: currentUser._id,
      }).lean();
      if (currentUserAppProfile !== null) {
        await cacheAppUserProfile([currentUserAppProfile]);
      }
    }
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

    // Validates startDate and endDate
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

    const currentOrgId = currentOrg?.organizationId?.toString();

    const currentUserIsOrgAdmin = currentUserAppProfile.adminFor.some(
      (organizationId) =>
        organizationId?.toString() === currentOrgId?.toString(),
    );

    if (
      !currentUserIsOrgAdmin &&
      currentUserAppProfile.isSuperAdmin === false
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Creates a fundraising campaign.
    const campaign = await FundraisingCampaign.create({
      name: args.data.name,
      fundId: args.data.fundId,
      organizationId: args.data.organizationId,
      startDate: args.data.startDate,
      endDate: args.data.endDate,
      fundingGoal: args.data.fundingGoal,
      currency: args.data.currency,
    });

    // Adds campaign to the parent fund
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
