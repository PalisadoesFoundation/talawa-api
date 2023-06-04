import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { attendees } from "./attendees";
import { organization } from "./organization";
import { projects } from "./projects";

export const Event: EventResolvers = {
  attendees,
  organization,
  projects,
};
