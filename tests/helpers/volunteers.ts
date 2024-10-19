import type {
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup,
} from "../../src/models";
import { Event, EventVolunteer, EventVolunteerGroup } from "../../src/models";
import type { Document } from "mongoose";
import {
  createTestUser,
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "./userAndOrg";
import { nanoid } from "nanoid";
import type { TestEventType } from "./events";

export type TestVolunteerType = InterfaceEventVolunteer & Document;
export type TestVolunteerGroupType = InterfaceEventVolunteerGroup & Document;

export const createTestVolunteerAndGroup = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestEventType,
    TestVolunteerType,
    TestVolunteerGroupType,
  ]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const randomUser = await createTestUser();

  const testEvent = await Event.create({
    title: `title${nanoid().toLowerCase()}`,
    description: `description${nanoid().toLowerCase()}`,
    allDay: true,
    startDate: new Date(),
    recurring: false,
    isPublic: true,
    isRegisterable: true,
    creatorId: testUser?._id,
    admins: [testUser?._id],
    organization: testOrganization?._id,
    volunteers: [],
    volunteerGroups: [],
  });

  const testVolunteer = await EventVolunteer.create({
    creator: randomUser?._id,
    event: testEvent?._id,
    user: testUser?._id,
    groups: [],
    assignments: [],
  });

  // create a volunteer group with testVolunteer as a member & leader
  const testVolunteerGroup = await EventVolunteerGroup.create({
    creator: randomUser?._id,
    event: testEvent?._id,
    volunteers: [testVolunteer?._id],
    leader: testVolunteer?._id,
    assignments: [],
    name: "Test Volunteer Group 1",
  });

  // add volunteer & group to event
  await Event.updateOne(
    {
      _id: testEvent?._id,
    },
    {
      $push: {
        volunteers: testVolunteer?._id,
        volunteerGroups: testVolunteerGroup?._id,
      },
    },
  );

  // add group to volunteer
  await EventVolunteer.updateOne(
    {
      _id: testVolunteer?._id,
    },
    {
      $push: {
        groups: testVolunteerGroup?._id,
      },
    },
  );

  return [
    testUser,
    testOrganization,
    testEvent,
    testVolunteer,
    testVolunteerGroup,
  ];
};
