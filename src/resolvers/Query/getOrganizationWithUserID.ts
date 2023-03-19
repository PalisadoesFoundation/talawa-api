import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const getOrganizationWithUserID: QueryResolvers["getOrganizationWithUserID"] =
  async (_parent, args) => {
    return Organization.find({
      members: args.id,
    }).lean();
  };
