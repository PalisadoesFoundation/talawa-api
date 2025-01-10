import "dotenv/config";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceOrganization } from "../../models";
import { Organization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";

/**
 * Mutation resolver function to add or update an organization's image.
 *
 * This function performs the following actions:
 * 1. Retrieves the organization from the cache or database based on the provided `organizationId`.
 * 2. Checks if the organization exists. If not, throws a not found error.
 * 3. Verifies if the current user is an admin of the organization.
 * 4. Uploads the provided image file and updates the organization's image field with the new file name.
 * 5. Updates the organization document in the database with the new image information.
 * 6. Caches the updated organization data.
 *
 * @param _parent - The parent object for the mutation. Typically, this is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `organizationId`: The ID of the organization to which the image is being added or updated.
 *   - `file`: The encoded image file to be uploaded.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the updated organization document with the new image.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 * @see adminCheck - Utility function to verify if a user is an admin of an organization.
 * @see uploadEncodedImage - Utility function to handle the upload of an encoded image file.
 * @see cacheOrganizations - Service function to cache the updated organization data.
 * @see findOrganizationsInCache - Service function to retrieve organizations from cache.
 *
 * @remarks
 * The function uses the `findOrganizationsInCache` method to first attempt to retrieve the organization from the cache.
 * If the organization is not found in the cache, it queries the database.
 * It then verifies the user's admin status and performs the image upload before updating the organization's image field.
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
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, organization);

    // Upload Image
    const uploadImageFileName = await uploadEncodedImage(
      args.file,
      organization.image,
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
      },
    ).lean();

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    return updatedOrganization as InterfaceOrganization;
  };
