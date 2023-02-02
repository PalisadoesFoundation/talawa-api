import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "./userAndOrg";
import { Event, User, Interface_Event } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type testEventType =
  | (Interface_Event & Document<any, any, Interface_Event>)
  | null;

export const createTestEvent = async (): Promise<
  [testUserType, testOrganizationType, testEventType]
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
