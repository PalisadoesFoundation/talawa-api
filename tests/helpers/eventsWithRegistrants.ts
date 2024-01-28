import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { InterfaceEvent } from "../../src/models";
import { Event, EventAttendee, Organization, User } from "../../src/models";
import type { Document } from "mongoose";
import { createTestVenue, TestVenueType } from "./venue";

export type TestEventType =
  | (InterfaceEvent & Document<any, any, InterfaceEvent>)
  | null;

export const createTestEventWithRegistrants = async (
  isAdmin = true
): Promise<
  [TestUserType, TestOrganizationType, TestEventType, TestVenueType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testVenue = await createTestVenue();
  const testEvent = await Event.create({
    creatorId: testUser!._id,
    admins: [testUser!._id],
    organization: testOrganization!._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    venue: testVenue!._id,
    startDate: new Date().toString(),
  });

  await Organization.updateOne(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        venues: testVenue?._id,
      },
    }
  );

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

  return [testUser, testOrganization, testEvent, testVenue];
};
