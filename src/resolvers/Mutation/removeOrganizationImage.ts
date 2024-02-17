import {
  ORGANIZATION_IMAGE_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceOrganization } from "../../models";
import { Organization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck, deleteImage } from "../../utilities";
/**
 * This function enables to remove an organization's image.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the organization exists
 * 3. If the user is the admin of the organization.
 * @returns Updated Organization.
 */
export const removeOrganizationImage: MutationResolvers["removeOrganizationImage"] =
  async (_parent, args, context) => {
    let organization;

    const organizationFoundInCache = await findOrganizationsInCache([
      args.organizationId,
    ]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache[0] == null) {
      organization = await Organization.findOne({
        _id: args.organizationId,
      }).lean();
      if (organization) await cacheOrganizations([organization]);
    }

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization
    await adminCheck(context.userId, organization);

    // Checks whether organization.image exists.
    if (!organization.image) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_IMAGE_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_IMAGE_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_IMAGE_NOT_FOUND_ERROR.PARAM,
      );
    }

    await deleteImage(organization.image);

    // Sets image field of organization to null and returns the updated organization.
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          image: null,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    return updatedOrganization as InterfaceOrganization;
  };
