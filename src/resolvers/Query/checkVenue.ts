import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization, User, Venue } from "../../models";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { compareDates } from "../../libraries/validators/compareDates";
import { errors, requestContext } from "../../libraries";
import { Time } from "../../helpers/timeCorrection";
import { CheckVenue } from "../../helpers/checkVenue";
/**
 * This query will fetch all the available venues in a time frame.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns All the available venues along with their details
 */
export const checkVenue: QueryResolvers["checkVenue"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();
  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: args.data?.organizationId,
  }).lean();
  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  const compareDatesResult = compareDates(
    args.data?.startDate,
    args.data?.endDate
  );
  if (compareDatesResult !== "") {
    throw new errors.InputValidationError(
      requestContext.translate(compareDatesResult),
      compareDatesResult
    );
  }
  if (args.data && args.data.startTime && args.data.startDate)
    args.data.startTime = Time.correct(
      args.data?.startDate,
      args.data?.startTime
    );
  if (args.data && args.data.endTime && args.data.endDate)
    args.data.endTime = Time.correct(args.data?.endDate, args.data?.endTime);
  const eventConflicts = await CheckVenue.check(args);

  const unavailableVenueIds = eventConflicts.map((conflict) =>
    conflict.venue.toString()
  );

  const availableVenues = organization.venues.filter(
    (venue) => !unavailableVenueIds.includes(venue._id.toString())
  );

  const availableVenuesDetails = await Venue.find({
    _id: { $in: availableVenues },
  });

  return availableVenuesDetails;
};
