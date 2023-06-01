import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { attendees } from "./attendees";
import { projects } from "./projects";

export const Event: EventResolvers = {
  attendees,
  projects,
};
