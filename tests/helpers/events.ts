import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import { EventVolunteerResponse } from "../../src/constants";
import type {
  InterfaceEvent,
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup,
} from "../../src/models";
import {
  AppUserProfile,
  Event,
  EventAttendee,
  EventVolunteer,
  EventVolunteerGroup,
  User,
} from "../../src/models";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUser, createTestUserAndOrganization } from "./userAndOrg";

export type TestEventType = (InterfaceEvent & Document) | null;

export type TestEventVolunteerType =
  | (InterfaceEventVolunteer & Document)
  | null;

export type TestEventVolunteerGroupType = InterfaceEventVolunteerGroup &
  Document;

export const createTestEvent = async (): Promise<
  [TestUserType, TestOrganizationType, TestEventType]
> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  if (testUser && testOrganization) {
    const testEvent = await Event.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      allDay: true,
      startDate: new Date(),
      recurring: false,
      isPublic: true,
      isRegisterable: true,
      creatorId: testUser._id,
      admins: [testUser._id],
      organization: testOrganization._id,
      images: ["image.png", "image2.png", "image3.png", "image4.png"],
    });

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $push: {
          registeredEvents: testEvent._id,
        },
      },
    );
    await AppUserProfile.updateOne(
      {
        userId: testUser._id,
      },
      {
        $push: {
          eventAdmin: testEvent._id,
          createdEvents: testEvent._id,
        },
      },
    );

    return [testUser, testOrganization, testEvent];
  } else {
    return [testUser, testOrganization, null];
  }
};

export const createEventWithRegistrant = async (
  userId: string,
  organizationId: string,
  allDay: boolean,
): Promise<TestEventType> => {
  const testEvent = await Event.create({
    creatorId: userId,
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
    location: `location${nanoid()}`,
  });

  await EventAttendee.create({
    userId,
    eventId: testEvent?._id,
  });

  await User.updateOne(
    {
      _id: userId,
    },
    {
      $push: {
        registeredEvents: testEvent._id,
      },
    },
  );
  await AppUserProfile.updateOne(
    {
      userId,
    },
    {
      $push: {
        eventAdmin: testEvent._id,
        createdEvents: testEvent._id,
      },
    },
  );
  return testEvent;
};

export const createTestEventAndVolunteer = async (): Promise<
  [TestUserType, TestUserType, TestEventType, TestEventVolunteerType]
> => {
  const [creatorUser, , testEvent] = await createTestEvent();
  const volunteerUser = await createTestUser();
  const testEventVolunteer = await EventVolunteer.create({
    userId: volunteerUser?._id,
    eventId: testEvent?._id,
    isInvited: true,
    isAssigned: false,
    creatorId: creatorUser?._id,
    response: EventVolunteerResponse.NO,
  });

  return [volunteerUser, creatorUser, testEvent, testEventVolunteer];
};

export const createTestEventVolunteerGroup = async (): Promise<
  [
    TestUserType,
    TestUserType,
    TestEventType,
    TestEventVolunteerType,
    TestEventVolunteerGroupType,
  ]
> => {
  const [creatorUser, volunteerUser, testEvent, testEventVolunteer] =
    await createTestEventAndVolunteer();
  const testEventVolunteerGroup = await EventVolunteerGroup.create({
    name: "testEventVolunteerGroup",
    volunteersRequired: 1,
    eventId: testEvent?._id,
    creatorId: creatorUser?._id,
    leaderId: creatorUser?._id,
    volunteers: [testEventVolunteer?._id],
  });

  return [
    creatorUser,
    volunteerUser,
    testEvent,
    testEventVolunteer,
    testEventVolunteerGroup,
  ];
};
