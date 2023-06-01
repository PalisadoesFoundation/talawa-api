import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { InterfaceEvent } from "../../src/models";
import { Event, EventAttendee, User } from "../../src/models";
import type { Document } from "mongoose";

export type TestEventType =
  | (InterfaceEvent & Document<any, any, InterfaceEvent>)
  | null;

export const createTestEventWithRegistrants = async (
  isAdmin = true
): Promise<[TestUserType, TestOrganizationType, TestEventType]> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();

  const testEvent = await Event.create({
    creator: testUser!._id,
    admins: [testUser!._id],
    organization: testOrganization!._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
  });

  await EventAttendee.create({
    userId: testUser!._id,
    eventId: testEvent!._id,
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $push: {
        eventAdmin: isAdmin ? testEvent._id : [],
        createdEvents: testEvent._id,
        registeredEvents: testEvent._id,
      },
    }
  );

  return [testUser, testOrganization, testEvent];
};
