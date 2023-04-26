import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";
import { Event, User, InterfaceEvent } from "../../src/models";
import { Document } from "mongoose";

export type TestEventType =
  | (InterfaceEvent & Document<any, any, InterfaceEvent>)
  | null;

export const createTestEventWithRegistrants = async (
  isAdmin = true
): Promise<[TestUserType, TestOrganizationType, TestEventType]> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  if (testUser && testOrganization) {
    const testEvent = await Event.create({
      creator: testUser._id,
      registrants: [
        {
          userId: testUser._id,
          user: testUser._id,
          status: "ACTIVE",
        },
      ],
      admins: [testUser._id],
      organization: testOrganization._id,
      isRegisterable: true,
      isPublic: true,
      title: "title",
      description: "description",
      allDay: true,
      startDate: new Date().toString(),
    });

    await User.updateOne(
      {
        _id: testUser._id,
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
  } else {
    return [testUser, testOrganization, null];
  }
};
