import {
  ORGANIZATION_NOT_FOUND_ERROR,
  VENUE_NOT_FOUND_ERROR,
} from "../../constants";
import { errors } from "../../libraries";
import { Organization, Venue } from "../../models";
import type { QueryResolvers } from "./../../types/generatedGraphQLTypes";
/**
 * This query fetch the venue from the database.
 * @param _parent-
 * @param args - An object that contains `id` for the venue.
 * @param context-
 * @returns An object that contains venue data. If the venue is not found then it throws a `NotFoundError` error.
 */

export const venue: QueryResolvers["venue"] = async (_parent, args) => {
  const venue = await Venue.findById({
    _id: args.id,
  });

  if (!venue) {
    throw new errors.NotFoundError(
      VENUE_NOT_FOUND_ERROR.MESSAGE,
      VENUE_NOT_FOUND_ERROR.CODE,
      VENUE_NOT_FOUND_ERROR.PARAM,
    );
  }

  const organization = await Organization.findById({
    _id: venue.organization,
  });

  if (!organization) {
    throw new errors.NotFoundError(
      ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  return {
    ...venue.toObject(),
    organization: organization.toObject(),
  };
};
