import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceOrganization } from "../../models";
import { Organization } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";

import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
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
    let organization;

    const organizationFoundInCache = await findOrganizationsInCache([args.id]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache[0] == null) {
      organization = await Organization.findOne({
        _id: args.id,
      }).lean();
      if (organization) await cacheOrganizations([organization]);
    }

    // Checks if organization with _id === args.id exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // checks if the current user is an admin of the organization
    await adminCheck(context.userId, organization);

    let uploadImageFileName;
    if (args.file) {
      uploadImageFileName = await uploadEncodedImage(
        args.file,
        organization?.image,
      );
    }

    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          ...args.data,
          image: uploadImageFileName || organization.image,
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
