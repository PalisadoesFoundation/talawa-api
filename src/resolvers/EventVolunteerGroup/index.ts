import type { EventVolunteerGroupResolvers } from "../../types/generatedGraphQLTypes";
import { leader } from "./leader";
import { creator } from "./creator";
import { event } from "./event";

export const EventVolunteerGroup: EventVolunteerGroupResolvers = {
  creator,
  leader,
  event,
};
