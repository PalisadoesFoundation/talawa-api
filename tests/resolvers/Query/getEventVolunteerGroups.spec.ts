import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestEventType,
  TestEventVolunteerGroupType,
  TestEventVolunteerType,
} from "../../helpers/events";
import type { TestUserType } from "../../helpers/user";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import type { InterfaceEventVolunteerGroup } from "../../../src/models";
import { EventVolunteer, EventVolunteerGroup } from "../../../src/models";
import { getEventVolunteerGroups } from "../../../src/resolvers/Query/getEventVolunteerGroups";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testEventVolunteer1: TestEventVolunteerType;
let testVolunteerGroup1: TestEventVolunteerGroupType;
let testVolunteerGroup2: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [organization, event, user1, , volunteer1, , volunteerGroup] =
    await createVolunteerAndActions();

  testOrganization = organization;
  testEvent = event;
  testUser1 = user1;
  testEventVolunteer1 = volunteer1;
  testVolunteerGroup1 = volunteerGroup;
  testVolunteerGroup2 = await EventVolunteerGroup.create({
    creator: testUser1?._id,
    event: testEvent?._id,
    volunteers: [testEventVolunteer1?._id],
    leader: testUser1?._id,
    assignments: [],
    name: "Test Volunteer Group 2",
  });

  await EventVolunteer.updateOne(
    { _id: testEventVolunteer1?._id },
    { groups: [testVolunteerGroup1?._id, testVolunteerGroup2?._id] },
    {
      new: true,
    },
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getEventVolunteerGroups", () => {
  it(`getEventVolunteerGroups - eventId, name_contains, orderBy is volunteers_ASC`, async () => {
    const groups = (await getEventVolunteerGroups?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
          name_contains: testVolunteerGroup1.name,
          leaderName: testUser1?.firstName,
        },
        orderBy: "volunteers_ASC",
      },
      {},
    )) as unknown as InterfaceEventVolunteerGroup[];

    expect(groups[0].name).toEqual(testVolunteerGroup1.name);
  });

  it(`getEventVolunteerGroups - userId, orgId, orderBy is volunteers_DESC`, async () => {
    const groups = (await getEventVolunteerGroups?.(
      {},
      {
        where: {
          userId: testUser1?._id.toString(),
          orgId: testOrganization?._id,
        },
        orderBy: "volunteers_DESC",
      },
      {},
    )) as unknown as InterfaceEventVolunteerGroup[];
    expect(groups.length).toEqual(2);
  });

  it(`getEventVolunteerGroups - eventId, orderBy is assignments_ASC`, async () => {
    const groups = (await getEventVolunteerGroups?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
        },
        orderBy: "assignments_ASC",
      },
      {},
    )) as unknown as InterfaceEventVolunteerGroup[];
    expect(groups[0].name).toEqual(testVolunteerGroup2.name);
  });

  it(`getEventVolunteerGroups - eventId, orderBy is assignements_DESC`, async () => {
    const groups = (await getEventVolunteerGroups?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
        },
        orderBy: "assignments_DESC",
      },
      {},
    )) as unknown as InterfaceEventVolunteerGroup[];
    expect(groups[0].name).toEqual(testVolunteerGroup1.name);
  });

  it(`getEventVolunteerGroups - userId, wrong orgId`, async () => {
    const groups = (await getEventVolunteerGroups?.(
      {},
      {
        where: {
          userId: testUser1?._id.toString(),
          orgId: testEvent?._id,
        },
      },
      {},
    )) as unknown as InterfaceEventVolunteerGroup[];
    expect(groups).toEqual([]);
  });
});
