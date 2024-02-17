import { nanoid } from "nanoid";
import { CheckIn, type InterfaceFeedback, Feedback } from "../../src/models";
import type { Document } from "mongoose";
import { createEventWithCheckedInUser } from "./checkIn";
import type { TestEventType, TestCheckInType } from "./checkIn";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";

export type TestFeedbackType =
  | (InterfaceFeedback & Document<any, any, InterfaceFeedback>)
  | null;

export const createFeedbackWithIDs = async (
  eventId: string,
  eventAttendeeId: string
): Promise<TestFeedbackType> => {
  const feedback = await Feedback.create({
    eventId,
    rating: 3,
    review: nanoid(),
  });

  await CheckIn.findByIdAndUpdate(eventAttendeeId, {
    feedbackSubmitted: true,
  });

  return feedback;
};

export const createFeedback = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestEventType,
    TestCheckInType,
    TestFeedbackType
  ]
> => {
  const result = await createEventWithCheckedInUser();
  const feedback = await createFeedbackWithIDs(result[2]!._id, result[3]!._id);

  return [...result, feedback];
};
