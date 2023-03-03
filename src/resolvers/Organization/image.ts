// BASE_URL is the url on which the server is running, it converts the relative path to absolute path
import { BASE_URL } from "../../constants";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const image: OrganizationResolvers["image"] = async (parent) => {
  if (parent!.image) {
    return `${BASE_URL}${parent!.image}`;
  }
  return null;
};
