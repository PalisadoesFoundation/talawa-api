import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { InterfaceEvent } from "../../src/models";
import { Event, User } from "../../src/models";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestEventType =
  | (InterfaceEvent & Document<any, any, InterfaceEvent>)
  | null;

export const createTestEvent = async (): Promise<
  [TestUserType, TestOrganizationType, TestEventType]
> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testEvent = await Event.create({
    title: `title${nanoid().toLowerCase()}`,
    description: `description${nanoid().toLowerCase()}`,
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser!._id,
    admins: [testUser!._id],
    registrants: [],
    organization: testOrganization!._id,
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $push: {
        eventAdmin: testEvent._id,
        createdEvents: testEvent._id,
        registeredEvents: testEvent._id,
      },
    }
  );

  return [testUser, testOrganization, testEvent];
};

export const createEventWithRegistrant = async (
  userId: string,
  organizationId: string,
  allDay: boolean,
  recurrance: string
): Promise<TestEventType> => {
  const testEvent = await Event.create({
    creator: userId,
    registrants: [
      {
        userId: userId,
        user: userId,
      },
    ],
    admins: [userId],
    organization: organizationId,
    isRegisterable: true,
    isPublic: true,
    title: `title${nanoid()}`,
    description: `description${nanoid()}`,
    allDay: allDay,
    startDate: new Date().toString(),
    endDate: new Date().toString(),
    startTime: new Date().toString(),
    endTime: new Date().toString(),
    recurrance: recurrance,
    location: `location${nanoid()}`,
  });

  await User.updateOne(
    {
      _id: userId,
    },
    {
      $push: {
        eventAdmin: testEvent._id,
        createdEvents: testEvent._id,
        registeredEvents: testEvent._id,
      },
    }
  );
  return testEvent;
};
