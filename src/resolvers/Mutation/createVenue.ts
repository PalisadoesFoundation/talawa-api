import { InputValidationError } from "./../../libraries/errors/inputValidationError";
import { Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  VENUE_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
  VENUE_NAME_MISSING_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Venue } from "../../models/Venue";
/**
 * This function enables to create a venue in an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * 3. If the same venue already exists in an organization
 * @returns Created venue
 */

export const createVenue: MutationResolvers["createVenue"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: args.data?.organizationId,
  })
    .populate("venues")
    .lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }
  // Checks if the venue name provided is null, undefined or empty string
  if (!args.data?.name ?? "") {
    throw new errors.InputValidationError(
      requestContext.translate(VENUE_NAME_MISSING_ERROR.MESSAGE),
      VENUE_NAME_MISSING_ERROR.CODE,
      VENUE_NAME_MISSING_ERROR.PARAM
    );
  }
  if (organization.venues?.some((venue) => venue.name === args.data?.name)) {
    // Check if a venue with the same place already exists in the organization
    throw new errors.ConflictError(
      requestContext.translate(VENUE_ALREADY_EXISTS_ERROR.MESSAGE),
      VENUE_ALREADY_EXISTS_ERROR.CODE,
      VENUE_ALREADY_EXISTS_ERROR.PARAM
    );
  }

  const newVenue = await Venue.create({ ...args.data });

  // Add the new venue to the venues inside the organization
  await Organization.findOneAndUpdate(
    { _id: organization._id },
    { $push: { venues: newVenue._id } },
    { new: true }
  );

  return newVenue;
};
