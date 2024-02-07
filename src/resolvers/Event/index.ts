import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { attendees } from "./attendees";
import { attendeesCheckInStatus } from "./attendeesCheckInStatus";
import { averageFeedbackScore } from "./averageFeedbackScore";
import { feedback } from "./feedback";
import { organization } from "./organization";
import { actionItems } from "./actionItems";
import { creator } from "./creator";

export const Event: EventResolvers = {
  actionItems,
  attendees,
  attendeesCheckInStatus,
  averageFeedbackScore,
  feedback,
  organization,
  creator,
};
