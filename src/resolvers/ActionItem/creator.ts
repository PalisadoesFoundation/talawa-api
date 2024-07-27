import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `creator` field of an `ActionItem`.
 *
 * This function fetches the user who is the creator of a given action item.
 * It uses the `creatorId` field from the parent `ActionItem` object to find the corresponding user in the database.
 * The user details are then returned in a plain JavaScript object format.
 *
 * @param parent - The parent `ActionItem` object. This contains the `creatorId` field, which is used to find the user.
 * @returns A promise that resolves to the user object found in the database, or `null` if no user is found.
 *
 * @example
 * ```typescript
 * const actionItem = {
 *   creatorId: "60d0fe4f5311236168a109cb"
 * };
 * const user = await creator(actionItem);
 * console.log(user);
 * // Output might be: { _id: "60d0fe4f5311236168a109cb", name: "Jane Doe", email: "jane.doe@example.com" }
 * ```
 */
export const creator: ActionItemResolvers["creator"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
