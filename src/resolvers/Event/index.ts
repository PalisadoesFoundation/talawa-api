import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { attendees } from "./attendees";

export const Event: EventResolvers = {
  attendees,
};
