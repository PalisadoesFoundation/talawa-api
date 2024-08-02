import {
  FUND_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { Fund, type InterfaceFund } from "../../models/Fund";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";

/**
 * Creates a new fundraising fund for a specified organization.
 *
 * This function performs the following actions:
 * 1. Verifies the existence of the current user.
 * 2. Retrieves and caches the user's profile if not already cached.
 * 3. Verifies the existence of the specified organization.
 * 4. Checks if the current user is an admin of the organization.
 * 5. Verifies that the fund does not already exist for the given organization.
 * 6. Creates a new fund with the provided details.
 * 7. Updates the organization's list of funds to include the newly created fund.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.organizationId`: The ID of the organization for which the fund is being created.
 *   - `data.name`: The name of the fund.
 *   - `data.refrenceNumber`: The reference number for the fund.
 *   - `data.taxDeductible`: Indicates if the fund is tax-deductible.
 *   - `data.isDefault`: Indicates if the fund is a default fund.
 *   - `data.isArchived`: Indicates if the fund is archived.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user performing the operation.
 *
 * @returns The created fund record.
 */
export const createFund: MutationResolvers["createFund"] = async (
  _parent,
  args,
  context,
): Promise<InterfaceFund> => {
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

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUser === null) {
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

  const organization = await Organization.findOne({
    _id: args.data.organizationId,
  });

  // Checks whether the organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks whether the user is admin of the organization or not.
  await adminCheck(currentUser._id, organization);

  const existingFund = await Fund.findOne({
    name: args.data.name,
    organizationId: args.data.organizationId,
  });

  // Checks if the fund already exists.
  if (existingFund) {
    throw new errors.ConflictError(
      requestContext.translate(FUND_ALREADY_EXISTS.MESSAGE),
      FUND_ALREADY_EXISTS.CODE,
      FUND_ALREADY_EXISTS.PARAM,
    );
  }

  // Creates Fund with the provided data.
  const createdFund = await Fund.create({
    name: args.data.name,
    organizationId: args.data.organizationId,
    refrenceNumber: args.data.refrenceNumber,
    taxDeductible: args.data.taxDeductible,
    isDefault: args.data.isDefault,
    isArchived: args.data.isArchived,
    creatorId: context.userId,
  });

  // Pushes the created fund to the organization's funds array.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $push: {
        funds: createdFund._id,
      },
    },
  );

  return createdFund.toObject();
};
