import type {
  AgendaCategoryResolvers,
  ResolverTypeWrapper,
} from "../../types/generatedGraphQLTypes";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";

export const createdBy: AgendaCategoryResolvers["createdBy"] = async (
  parent,
): Promise<ResolverTypeWrapper<InterfaceUser>> => {
  const user = await User.findOne(parent.createdBy).lean();
  if (!user) {
    // Handle the case where the user is not found
    throw new Error("User not found");
  }
  return user; // This will now always return a user object, never null
};
