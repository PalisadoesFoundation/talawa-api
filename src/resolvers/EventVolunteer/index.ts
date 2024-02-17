import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";
import { event } from "./event";
import { creator } from "./creator";
import { user } from "./user";

export const EventVolunteer: EventVolunteerResolvers = {
  creator,
  event,
  user,
};
