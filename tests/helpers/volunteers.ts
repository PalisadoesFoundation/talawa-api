import type {
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup,
  InterfaceVolunteerMembership,
} from "../../src/models";
import {
  ActionItem,
  ActionItemCategory,
  Event,
  EventVolunteer,
  EventVolunteerGroup,
} from "../../src/models";
import type { Document } from "mongoose";
import {
  createTestUser,
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "./userAndOrg";
import { nanoid } from "nanoid";
import type { TestEventType } from "./events";
import type { TestActionItemType } from "./actionItem";

export type TestVolunteerType = InterfaceEventVolunteer & Document;
export type TestVolunteerGroupType = InterfaceEventVolunteerGroup & Document;
export type TestVolunteerMembership = InterfaceVolunteerMembership & Document;

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

export const createVolunteerAndActions = async (): Promise<
  [
    TestOrganizationType,
    TestEventType,
    TestUserType,
    TestUserType,
    TestVolunteerType,
    TestVolunteerType,
    TestVolunteerGroupType,
    TestActionItemType,
    TestActionItemType,
  ]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testUser2 = await createTestUser();

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

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(today.getMonth() - 2);
  const twoYearsAgo = new Date(today);
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  const testVolunteer1 = await EventVolunteer.create({
    creator: randomUser?._id,
    event: testEvent?._id,
    user: testUser?._id,
    groups: [],
    assignments: [],
    hasAccepted: true,
    hoursVolunteered: 10,
    hoursHistory: [
      {
        hours: 2,
        date: yesterday,
      },
      {
        hours: 4,
        date: twoWeeksAgo,
      },
      {
        hours: 2,
        date: twoMonthsAgo,
      },
      {
        hours: 2,
        date: twoYearsAgo,
      },
    ],
  });

  const testVolunteer2 = await EventVolunteer.create({
    creator: randomUser?._id,
    event: testEvent?._id,
    user: testUser2?._id,
    groups: [],
    assignments: [],
    hasAccepted: true,
    hoursVolunteered: 8,
    hoursHistory: [
      {
        hours: 1,
        date: yesterday,
      },
      {
        hours: 2,
        date: twoWeeksAgo,
      },
      {
        hours: 3,
        date: twoMonthsAgo,
      },
      {
        hours: 2,
        date: twoYearsAgo,
      },
    ],
  });

  // create a volunteer group with testVolunteer1 as a member & leader
  const testVolunteerGroup = await EventVolunteerGroup.create({
    creator: randomUser?._id,
    event: testEvent?._id,
    volunteers: [testVolunteer1?._id, testVolunteer2?._id],
    leader: testUser?._id,
    assignments: [],
    name: "Test Volunteer Group 1",
  });

  // add volunteer & group to event
  await Event.updateOne(
    {
      _id: testEvent?._id,
    },
    {
      $addToSet: {
        volunteers: { $each: [testVolunteer1?._id, testVolunteer2?._id] },
        volunteerGroups: testVolunteerGroup?._id,
      },
    },
  );

  const testActionItemCategory = await ActionItemCategory.create({
    creatorId: randomUser?._id,
    organizationId: testOrganization?._id,
    name: "Test Action Item Category 1",
    isDisabled: false,
  });

  const testActionItem1 = await ActionItem.create({
    creator: randomUser?._id,
    assigner: randomUser?._id,
    assignee: testVolunteer1?._id,
    assigneeType: "EventVolunteer",
    assigneeGroup: null,
    assigneeUser: null,
    actionItemCategory: testActionItemCategory?._id,
    event: testEvent?._id,
    organization: testOrganization?._id,
    allottedHours: 2,
    assignmentDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isCompleted: false,
  });

  const testActionItem2 = await ActionItem.create({
    creator: randomUser?._id,
    assigner: randomUser?._id,
    assigneeType: "EventVolunteerGroup",
    assigneeGroup: testVolunteerGroup?._id,
    assignee: null,
    assigneeUser: null,
    actionItemCategory: testActionItemCategory?._id,
    event: testEvent?._id,
    organization: testOrganization?._id,
    allottedHours: 4,
    assignmentDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 2000),
    isCompleted: false,
  });

  await EventVolunteer.findByIdAndUpdate(testVolunteer1?._id, {
    $push: {
      assignments: testActionItem1?._id,
    },
  });

  await EventVolunteer.updateMany(
    { _id: { $in: [testVolunteer1?._id, testVolunteer2?._id] } },
    {
      $push: {
        groups: testVolunteerGroup?._id,
        assignments: testActionItem2?._id,
      },
    },
  );

  await EventVolunteerGroup.findByIdAndUpdate(testVolunteerGroup?._id, {
    $addToSet: { assignments: testActionItem2 },
  });

  return [
    testOrganization,
    testEvent,
    testUser,
    testUser2,
    testVolunteer1,
    testVolunteer2,
    testVolunteerGroup,
    testActionItem1,
    testActionItem2,
  ];
};
