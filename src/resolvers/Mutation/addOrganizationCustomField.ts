import { Types } from "mongoose";
import {
  CUSTOM_FIELD_NAME_MISSING,
  CUSTOM_FIELD_TYPE_MISSING,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  AppUserProfile,
  Organization,
  OrganizationCustomField,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Mutation resolver to add a custom field to an organization.
 *
 * This function allows an admin to add a new custom field to the collection of fields for a specified organization. It performs several checks:
 *
 * 1. Verifies the existence of the user.
 * 2. Checks if the user has an application profile.
 * 3. Confirms that the organization exists.
 * 4. Ensures that the user is an admin for the organization or has super admin privileges.
 * 5. Validates that the name and type of the custom field are provided.
 *
 * If any of these conditions are not met, appropriate errors are thrown.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `organizationId`: The ID of the organization to which the custom field will be added.
 *   - `name`: The name of the new custom field.
 *   - `type`: The type of the new custom field.
 * @param context - The context of the entire application, containing user information and other context-specific data.
 *
 * @returns A promise that resolves to the newly added custom field object.
 *
 */
export const addOrganizationCustomField: MutationResolvers["addOrganizationCustomField"] =
  async (_parent, args, context) => {
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

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    let currentUserAppProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId,
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
      _id: args.organizationId,
    });

    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
      (orgId) =>
        orgId && new Types.ObjectId(orgId.toString()).equals(organization._id),
    );

    if (
      !(currentUserIsOrganizationAdmin || currentUserAppProfile.isSuperAdmin)
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    if (!args.name) {
      throw new errors.InputValidationError(
        requestContext.translate(CUSTOM_FIELD_NAME_MISSING.MESSAGE),
        CUSTOM_FIELD_NAME_MISSING.CODE,
        CUSTOM_FIELD_NAME_MISSING.PARAM,
      );
    }

    if (!args.type) {
      throw new errors.InputValidationError(
        requestContext.translate(CUSTOM_FIELD_TYPE_MISSING.MESSAGE),
        CUSTOM_FIELD_TYPE_MISSING.CODE,
        CUSTOM_FIELD_TYPE_MISSING.PARAM,
      );
    }

    const newCollectionField = new OrganizationCustomField({
      organizationId: args.organizationId,
      type: args.type,
      name: args.name,
    });

    await newCollectionField.save();

    await Organization.findOneAndUpdate(
      { _id: organization._id },
      {
        $push: { collectionFields: newCollectionField._id },
      },
    ).lean();

    return newCollectionField;
  };
