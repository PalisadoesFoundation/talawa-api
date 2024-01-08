import { VENUE_DOESNT_EXIST_ERROR } from "./../../constants";
import { User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Venue } from "../../models/Venue";
/**
 * This function enables to edit a venue.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the venue exists
 * @returns Updated venue
 */

export const editVenue: MutationResolvers["editVenue"] = async (
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

  const venue = await Venue.findOne({
    _id: args.data?._id,
  }).lean();

  // Find the venue by its _id and update its place and capacity
  const updatedVenue = await Venue.findOneAndUpdate(
    { _id: venue?._id },
    {
      $set: {
        name: args.data?.name,
        capacity: args.data?.capacity,
        description: args.data?.description,
      },
    },
    { new: true }
  );

  if (!updatedVenue) {
    throw new errors.NotFoundError(
      requestContext.translate(VENUE_DOESNT_EXIST_ERROR.MESSAGE),
      VENUE_DOESNT_EXIST_ERROR.CODE,
      VENUE_DOESNT_EXIST_ERROR.PARAM
    );
  }
  return updatedVenue;
};
