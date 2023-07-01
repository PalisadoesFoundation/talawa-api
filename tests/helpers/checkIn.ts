import { nanoid } from "nanoid";
import {
  CheckIn,
  EventAttendee,
  type InterfaceCheckIn,
} from "../../src/models";
import type { Document } from "mongoose";
import { createTestEventWithRegistrants } from "./eventsWithRegistrants";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import type { TestEventType } from "./task";

export type TestCheckInType =
  | (InterfaceCheckIn & Document<any, any, InterfaceCheckIn>)
  | null;

export const createEventWithCheckedInUser = async (): Promise<
  [TestUserType, TestOrganizationType, TestEventType, TestCheckInType]
> => {
  const [testUser, testOrg, testEvent] = await createTestEventWithRegistrants();

  const eventAttendee = await EventAttendee.findOne({
    userId: testUser!._id,
    eventId: testEvent!._id,
  }).lean();

  const checkIn = await CheckIn.create({
    eventAttendeeId: eventAttendee!._id,
    allotedRoom: nanoid(),
    allotedSeat: nanoid(),
    time: new Date(),
  });

  await EventAttendee.updateOne(
    {
      userId: testUser!._id,
      eventId: testEvent!._id,
    },
    {
      checkInId: checkIn!._id,
    }
  );

  return [testUser, testOrg, testEvent, checkIn];
};
