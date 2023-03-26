import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";
import { Event, User, Interface_Event } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestEventType =
  | (Interface_Event & Document<any, any, Interface_Event>)
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
  user_id: string,
  organization_id: string,
  allDay: boolean,
  recurrance: string
): Promise<TestEventType> => {
  const testEvent = await Event.create({
    creator: user_id,
    registrants: [
      {
        userId: user_id,
        user: user_id,
      },
    ],
    admins: [user_id],
    organization: organization_id,
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
      _id: user_id,
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
