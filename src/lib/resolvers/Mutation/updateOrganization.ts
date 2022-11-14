import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { Organization } from "../../models";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
} from "../../../constants";
import { adminCheck } from "../../utilities";
/**
 * This function enables to update an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists.
 * 2. The the user is an admin of the organization.
 * @returns Updated organization.
 */
export const updateOrganization: MutationResolvers["updateOrganization"] =
  async (_parent, args, context) => {
    const organization = await Organization.findOne({
      _id: args.id,
    }).lean();

    // Checks if organization with _id === args.id exists.
    if (!organization) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? ORGANIZATION_NOT_FOUND
          : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    // checks if the current user is an admin of the organization
    adminCheck(context.userId, organization);

    return await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          ...args.data,
        },
      },
      {
        new: true,
      }
    ).lean();
  };
