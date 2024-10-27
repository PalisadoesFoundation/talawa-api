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
import type { InterfaceVolunteerMembership } from "../../../src/models";
import { VolunteerMembership } from "../../../src/models";
import { getVolunteerMembership } from "../../../src/resolvers/Query/getVolunteerMembership";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testEventVolunteer1: TestEventVolunteerType;
let testEventVolunteerGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [, event, user1, , volunteer1, , volunteerGroup, ,] =
    await createVolunteerAndActions();

  testEvent = event;
  testUser1 = user1;
  testEventVolunteer1 = volunteer1;
  testEventVolunteerGroup = volunteerGroup;

  await VolunteerMembership.insertMany([
    {
      event: testEvent?._id,
      volunteer: testEventVolunteer1._id,
      status: "invited",
    },
    {
      event: testEvent?._id,
      volunteer: testEventVolunteer1._id,
      group: testEventVolunteerGroup._id,
      status: "requested",
    },
    {
      event: testEvent?._id,
      volunteer: testEventVolunteer1._id,
      status: "accepted",
    },
    {
      event: testEvent?._id,
      volunteer: testEventVolunteer1._id,
      status: "rejected",
    },
  ]);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getVolunteerMembership", () => {
  it(`getVolunteerMembership for userId, status invited`, async () => {
    const volunteerMemberships = (await getVolunteerMembership?.(
      {},
      {
        where: {
          userId: testUser1?._id.toString(),
          status: "invited",
        },
      },
      {},
    )) as unknown as InterfaceVolunteerMembership[];
    expect(volunteerMemberships[0].volunteer?._id).toEqual(
      testEventVolunteer1?._id,
    );
    expect(volunteerMemberships[0].status).toEqual("invited");
  });

  it(`getVolunteerMembership for eventId, status accepted`, async () => {
    const volunteerMemberships = (await getVolunteerMembership?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
          eventTitle: testEvent?.title,
          status: "accepted",
        },
        orderBy: "createdAt_ASC",
      },
      {},
    )) as unknown as InterfaceVolunteerMembership[];
    expect(volunteerMemberships[0].volunteer?._id).toEqual(
      testEventVolunteer1?._id,
    );
    expect(volunteerMemberships[0].status).toEqual("accepted");
    expect(volunteerMemberships[0].event._id).toEqual(testEvent?._id);
  });

  it(`getVolunteerMembership for eventId, filter group, userName`, async () => {
    const volunteerMemberships = (await getVolunteerMembership?.(
      {},
      {
        where: {
          eventId: testEvent?._id,
          filter: "group",
          userName: testUser1?.firstName,
        },
      },
      {},
    )) as unknown as InterfaceVolunteerMembership[];
    expect(volunteerMemberships[0].volunteer?._id).toEqual(
      testEventVolunteer1?._id,
    );
    expect(volunteerMemberships[0].status).toEqual("requested");
    expect(volunteerMemberships[0].event._id).toEqual(testEvent?._id);
    expect(volunteerMemberships[0].group?._id).toEqual(
      testEventVolunteerGroup?._id,
    );
  });

  it(`getVolunteerMembership for eventId, filter group, userName`, async () => {
    const volunteerMemberships = (await getVolunteerMembership?.(
      {},
      {
        where: {
          userId: testUser1?._id.toString(),
          filter: "individual",
        },
      },
      {},
    )) as unknown as InterfaceVolunteerMembership[];
    expect(volunteerMemberships.length).toEqual(3);
    expect(volunteerMemberships[0].group).toBeUndefined();
    expect(volunteerMemberships[1].group).toBeUndefined();
    expect(volunteerMemberships[2].group).toBeUndefined();
  });
});
