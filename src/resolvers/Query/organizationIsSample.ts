import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization, SampleData } from "../../models";
import { errors, requestContext } from "../../libraries";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";

export const isSampleOrganization: QueryResolvers["isSampleOrganization"] =
  async (_parent, args) => {
    const organizationId = args.id;

    const organization = await Organization.findById(args.id);

    if (!organization) {
      throw new errors.UnauthorizedError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    const sampleOrganization = await SampleData.findOne({
      documentId: organizationId,
    });

    return !!sampleOrganization;
  };
