import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestEventType,
  TestEventVolunteerGroupType,
  TestEventVolunteerType,
} from "../../helpers/events";
import type { TestUserType } from "../../helpers/user";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import type { InterfaceEventVolunteer } from "../../../src/models";
import { VolunteerMembership } from "../../../src/models";
import { updateEventVolunteer } from "../../../src/resolvers/Mutation/updateEventVolunteer";
import { EVENT_VOLUNTEER_INVITE_USER_MISTMATCH } from "../../../src/constants";
import { requestContext } from "../../../src/libraries";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testUser2: TestUserType;
let testEventVolunteer1: TestEventVolunteerType;
let testEventVolunteerGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
  const [, event, user1, user2, volunteer1, , volunteerGroup, , ,] =
    await createVolunteerAndActions();

  testEvent = event;
  testUser1 = user1;
  testUser2 = user2;
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

describe("resolvers -> Mutation -> updateEventVolunteer", () => {
  it(`throws error if context.userId !== volunteer._id`, async () => {
    try {
      (await updateEventVolunteer?.(
        {},
        {
          id: testEventVolunteer1?._id,
          data: {
            isPublic: false,
          },
        },
        { userId: testUser2?._id.toString() },
      )) as unknown as InterfaceEventVolunteer[];
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.MESSAGE,
      );
    }
  });

  it(`data remains same if no values are updated`, async () => {
    const updatedVolunteer = (await updateEventVolunteer?.(
      {},
      {
        id: testEventVolunteer1?._id,
        data: {},
      },
      { userId: testUser1?._id.toString() },
    )) as unknown as InterfaceEventVolunteer;
    expect(updatedVolunteer.isPublic).toEqual(testEventVolunteer1?.isPublic);
    expect(updatedVolunteer.hasAccepted).toEqual(
      testEventVolunteer1?.hasAccepted,
    );
  });

  it(`updates EventVolunteer`, async () => {
    const updatedVolunteer = (await updateEventVolunteer?.(
      {},
      {
        id: testEventVolunteer1?._id,
        data: {
          isPublic: false,
          hasAccepted: false,
          assignments: [],
        },
      },
      { userId: testUser1?._id.toString() },
    )) as unknown as InterfaceEventVolunteer;
    expect(updatedVolunteer.isPublic).toEqual(false);
    expect(updatedVolunteer.hasAccepted).toEqual(false);
    expect(updatedVolunteer.assignments).toEqual([]);
  });
});
