import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";

/**
 * Resolver functions for the fields of a `Fund`.
 *
 * These functions define how to resolve the fields of a `Fund` type.
 *
 * @see FundResolvers - The type definition for the resolvers of the Fund fields.
 *
 */
export const Fund: FundResolvers = {
  creator,
};
