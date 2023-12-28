import "dotenv/config";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { Organization } from "../../models";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { storeTransaction } from "../../utilities/storeTransaction";
/**
 * This function adds Organization Image.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2. If the organization exists
 * 3. If the user trying to add the image is an admin of organization
 * @returns Updated Organization
 */
export const addOrganizationImage: MutationResolvers["addOrganizationImage"] =
  async (_parent, args, context) => {
    let organization;

    const organizationsFoundInCache = await findOrganizationsInCache([
      args.organizationId,
    ]);

    organization = organizationsFoundInCache[0];

    if (organization === null) {
      organization = await Organization.findOne({
        _id: args.organizationId,
      }).lean();
    }

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, organization);

    // Upload Image
    const uploadImageFileName = await uploadEncodedImage(
      args.file,
      organization.image
    );

    // Updates the organization with new image and returns the updated organization.
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          image: uploadImageFileName,
        },
      },
      {
        new: true,
      }
    ).lean();
    storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "Organization",
      `Organization:${organization._id} updated image`
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    return updatedOrganization!;
  };
