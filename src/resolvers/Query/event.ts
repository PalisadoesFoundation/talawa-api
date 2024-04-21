import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { errors } from "../../libraries";
import { EVENT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch the event with _id === args.id from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the event that need to be fetched.
 * @returns An `event` object. If the `event` object is null then it throws `NotFoundError` error.
 * @remarks You can learn about GraphQL `Resolvers`
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const event: QueryResolvers["event"] = async (_parent, args) => {
  const event = await Event.findOne({
    _id: args.id,
  })
    .populate("creatorId", "-password")
    .populate("admins", "-password")
    .lean();

  if (!event) {
    throw new errors.NotFoundError(
      EVENT_NOT_FOUND_ERROR.DESC,
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  return event;
};
