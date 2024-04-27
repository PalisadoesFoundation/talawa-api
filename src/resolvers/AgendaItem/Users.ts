import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const users: AgendaItemResolvers["users"] = async (parent) => {
  const userIds = parent.users; // Assuming parent.users is an array of user ids
  const users = await User.find({ _id: { $in: userIds } }); // Assuming User.find() returns a promise
  return users;
};
