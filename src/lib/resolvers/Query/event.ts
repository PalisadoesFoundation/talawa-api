import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Event } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
} from "../../../constants";

/**
 * This query will fetch the event with `ACTIVE` status from database.
 * @param _parent 
 * @param args - An object that contains `id` of the event that need to be fetched.
 * @returns An `event` object. If the `event` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers` 
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const event: QueryResolvers["event"] = async (_parent, args) => {
  const event = await Event.findOne({
    _id: args.id,
    status: "ACTIVE",
  })
    .populate("creator", "-password")
    .populate("tasks")
    .populate("admins", "-password")
    .lean();

  if (!event) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  return event;
};
