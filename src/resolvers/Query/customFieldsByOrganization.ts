import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization, OrganizationCustomField } from "../../models";
import { errors, requestContext } from "../../libraries";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";

/**
 * This query will fetch all the custom Fields for the organization in the database.
 * @param _parent-
 * @param args - An object that contains `id` of the organization.
 * @returns An object `CustomFields` that contains all the custom fields of the specified organization.
 * The following checks are made:
 *  1. if the organization exists
 */

export const customFieldsByOrganization: QueryResolvers["customFieldsByOrganization"] =
  async (_parent, args) => {
    const organization = await Organization.findOne({
      _id: args.id,
    });

    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    const customFields = await OrganizationCustomField.find({
      organizationId: organization._id.toString(),
    });

    return customFields;
  };
