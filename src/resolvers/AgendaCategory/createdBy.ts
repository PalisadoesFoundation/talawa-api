import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import type { Types } from "mongoose";
/**
 * Resolver function for the `createdBy` field of an `AgendaCategory`.
 *
 * This function retrieves the user who created a specific agenda category.
 *
 * @param parent - The parent object representing the agenda category. It contains information about the agenda category, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the agenda category.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see AgendaCategoryResolvers - The type definition for the resolvers of the AgendaCategory fields.
 *
 */
//@ts-expect-error - type error
export const createdBy: AgendaCategoryResolvers["createdBy"] = async (
  parent,
): Promise<InterfaceUser | null> => {
  if (!parent.createdBy) return null;

  const userId = parent.createdBy instanceof User 
    ? parent.createdBy._id 
    : parent.createdBy;

  return User.findOne({
    _id: userId as Types.ObjectId,
  }).lean() as Promise<InterfaceUser | null>;
};
