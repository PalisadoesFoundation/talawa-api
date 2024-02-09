import {
  CUSTOM_FIELD_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { OrganizationCustomField, Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables an admin to remove an organization colleciton field.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists.
 * 3. If the user is an admin for the organization.
 * 4. If the custom field to be removed exists
 * @returns Deleted Organization Custom Field.
 */

export const removeOrganizationCustomField: MutationResolvers["removeOrganizationCustomField"] =
  async (_parent, args, context) => {
    const { organizationId, customFieldId } = args;

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

    const organization = await Organization.findOne({
      _id: organizationId,
    });

    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
      (organization) => organization.equals(organization._id),
    );

    if (
      !(currentUserIsOrganizationAdmin || currentUser.userType === "SUPERADMIN")
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    organization.customFields = organization.customFields.filter(
      (field) => !field.equals(customFieldId),
    );

    await organization.save();

    const removedCustomField =
      await OrganizationCustomField.findByIdAndDelete(customFieldId);

    if (!removedCustomField) {
      throw new errors.UnauthorizedError(
        requestContext.translate(CUSTOM_FIELD_NOT_FOUND.MESSAGE),
        CUSTOM_FIELD_NOT_FOUND.CODE,
        CUSTOM_FIELD_NOT_FOUND.PARAM,
      );
    }

    return removedCustomField;
  };
