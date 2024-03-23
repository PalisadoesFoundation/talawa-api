import { Types } from "mongoose";
import {
  CUSTOM_FIELD_NAME_MISSING,
  CUSTOM_FIELD_TYPE_MISSING,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import {
  AppUserProfile,
  Organization,
  OrganizationCustomField,
  User,
} from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables an admin to add an organization colleciton field.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the user has appProfile
 * 3. If the organization exists.
 * 4. If the user is an admin for the organization.
 * 5. If the required name and value was provided for the new custom field
 * @returns Newly Added Custom Field.
 */

export const addOrganizationCustomField: MutationResolvers["addOrganizationCustomField"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    });

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
