import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "./userAndOrg";
import { Event, User, Interface_Event } from "../../src/models";
import { Document } from "mongoose";

export type testEventType =
  | (Interface_Event & Document<any, any, Interface_Event>)
  | null;

export const createTestEventWithRegistrants = async (
  isAdmin = true
): Promise<[testUserType, testOrganizationType, testEventType]> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testEvent = await Event.create({
    creator: testUser!._id,
    registrants: [
      {
        userId: testUser!._id,
        user: testUser!._id,
        status: "ACTIVE",
      },
    ],
    admins: [testUser!._id],
    organization: testOrganization!._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
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
