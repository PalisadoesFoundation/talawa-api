import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";
import { event } from "./event";
import { creator } from "./creator";
import { user } from "./user";
import { group } from "./group";

export const EventVolunteer: EventVolunteerResolvers = {
  creator,
  event,
  group,
  user,
};
