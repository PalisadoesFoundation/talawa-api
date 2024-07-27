import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `createdBy` field of an `AgendaItem`.
 *
 * This function retrieves the user who created a specific agenda item.
 * It uses the `createdBy` field from the parent `AgendaItem` object to find the corresponding user in the database.
 * The user details are then returned as a plain JavaScript object.
 *
 * @param parent - The parent `AgendaItem` object. This contains the `createdBy` field, which is used to query the user.
 * @returns A promise that resolves to the user object found in the database, or `null` if no user is found.
 *
 */
//@ts-expect-error - type error
export const createdBy: AgendaItemResolvers["createdBy"] = async (parent) => {
  return User.findOne(parent.createdBy).lean();
};
