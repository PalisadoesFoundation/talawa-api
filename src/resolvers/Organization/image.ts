// Context object contains an apiRootUrl for mapping DNS request of server to its domain, for example: http:abcd.com/
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const image: OrganizationResolvers["image"] = async (
  parent,
  _args,
  context
) => {
  if (parent!.image) {
    return `${context.apiRootUrl}${parent!.image}`;
  }
  return null;
};
