import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `assigner` field of an `ActionItem`.
 *
 * This function fetches the user who is the assigner of a given action item.
 * It uses the `assignerId` field from the parent `ActionItem` object to find the corresponding user in the database.
 * The user details are then returned in a plain JavaScript object format.
 *
 * @param parent - The parent `ActionItem` object. This contains the `assignerId` field, which is used to find the user.
 * @returns A promise that resolves to the user object found in the database, or `null` if no user is found.
 *
 */
export const assigner: ActionItemResolvers["assigner"] = async (parent) => {
  return User.findOne({
    _id: parent.assignerId,
  }).lean();
};
