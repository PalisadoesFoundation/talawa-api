import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { attendees } from "./attendees";
import { attendeesCheckInStatus } from "./attendeesCheckInStatus";
import { averageFeedbackScore } from "./averageFeedbackScore";
import { feedback } from "./feedback";
import { organization } from "./organization";
import { projects } from "./projects";
import { creatorId } from "./creatorId";

export const Event: EventResolvers = {
  attendees,
  attendeesCheckInStatus,
  averageFeedbackScore,
  feedback,
  organization,
  projects,
  creatorId,
};
