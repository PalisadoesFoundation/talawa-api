// requestUrl() is a function which returns current server's domain on passing the context object.
import { requestUrl } from "../../libraries/requestUrl";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const image: OrganizationResolvers["image"] = async (
  parent,
  _args,
  context
) => {
  if (parent!.image) {
    return `${requestUrl(context)}${parent!.image}`;
  }
  return null;
};
