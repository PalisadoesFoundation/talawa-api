import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization, SampleData } from "../../models";
import { errors, requestContext } from "../../libraries";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
/**
 * Checks whether the specified organization is a sample organization.
 *
 * This function performs the following steps:
 * 1. Retrieves the organization from the database using the provided organization ID.
 * 2. If the organization is not found, throws an unauthorized error.
 * 3. Searches for a sample document associated with the organization ID in the `SampleData` collection.
 * 4. Returns `true` if the sample document is found, indicating the organization is a sample organization; otherwise, returns `false`.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param args - The arguments provided by the GraphQL query, including:
 *   - `id`: The ID of the organization to check.
 *
 * @returns  A promise that resolves to `true` if the organization is a sample organization, otherwise `false`.
 */

export const isSampleOrganization: QueryResolvers["isSampleOrganization"] =
  async (_parent, args) => {
    const organizationId = args.id;

    const organization = await Organization.findById(args.id);

    if (!organization) {
      throw new errors.UnauthorizedError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    const sampleOrganization = await SampleData.findOne({
      documentId: organizationId,
    });

    return !!sampleOrganization;
  };
