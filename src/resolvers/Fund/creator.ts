import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { Types } from "mongoose";

/**
 * Resolver function for the `creator` field of a `Fund`.
 *
 * This function retrieves the user who created a specific fund.
 *
 * @param parent - The parent object representing the fund. It contains information about the fund, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the fund.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see FundResolvers - The type definition for the resolvers of the Fund fields.
 *
 */
export const creator: FundResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: new Types.ObjectId(parent.creatorId?.toString()),
  }).lean();
};
