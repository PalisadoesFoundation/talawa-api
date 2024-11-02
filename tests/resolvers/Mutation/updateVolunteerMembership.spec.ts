import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestEventType,
  TestEventVolunteerGroupType,
  TestEventVolunteerType,
} from "../../helpers/events";
import { createTestUser, type TestUserType } from "../../helpers/user";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import { VolunteerMembership } from "../../../src/models";
import { updateVolunteerMembership } from "../../../src/resolvers/Mutation/updateVolunteerMembership";
import { Types } from "mongoose";
import {
  EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { requestContext } from "../../../src/libraries";
import { MembershipStatus } from "../Query/getVolunteerMembership.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testEventVolunteer1: TestEventVolunteerType;
let testEventVolunteerGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
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
      status: MembershipStatus.INVITED,
    },
    {
      event: testEvent?._id,
      volunteer: testEventVolunteer1._id,
      group: testEventVolunteerGroup._id,
      status: MembershipStatus.REQUESTED,
    },
    {
      event: testEvent?._id,
      volunteer: testEventVolunteer1._id,
      status: MembershipStatus.ACCEPTED,
    },
    {
      event: testEvent?._id,
      volunteer: testEventVolunteer1._id,
      status: MembershipStatus.REJECTED,
    },
  ]);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateVolunteerMembership", () => {
  it("throws NotFoundError if current User does not exist", async () => {
    try {
      const membership = await VolunteerMembership.findOne({
        status: MembershipStatus.REQUESTED,
        group: testEventVolunteerGroup._id,
        volunteer: testEventVolunteer1?._id,
      });

      await updateVolunteerMembership?.(
        {},
        {
          id: membership?._id.toString() ?? "",
          status: MembershipStatus.ACCEPTED,
        },
        { userId: new Types.ObjectId().toString() },
      );
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if VolunteerMembership does not exist", async () => {
    try {
      await VolunteerMembership.findOne({
        status: MembershipStatus.REQUESTED,
        group: testEventVolunteerGroup._id,
        volunteer: testEventVolunteer1?._id,
      });

      await updateVolunteerMembership?.(
        {},
        {
          id: new Types.ObjectId().toString() ?? "",
          status: MembershipStatus.ACCEPTED,
        },
        { userId: testUser1?._id },
      );
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedUser Error", async () => {
    try {
      const membership = await VolunteerMembership.findOne({
        status: MembershipStatus.REJECTED,
        volunteer: testEventVolunteer1?._id,
      });

      const randomUser = await createTestUser();

      await updateVolunteerMembership?.(
        {},
        {
          id: membership?._id.toString() as string,
          status: MembershipStatus.ACCEPTED,
        },
        { userId: randomUser?._id.toString() as string },
      );
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`updateVolunteerMembership (with group) - set to accepted `, async () => {
    const membership = await VolunteerMembership.findOne({
      status: MembershipStatus.INVITED,
      volunteer: testEventVolunteer1?._id,
    });

    const updatedMembership = await updateVolunteerMembership?.(
      {},
      {
        id: membership?._id.toString() ?? "",
        status: MembershipStatus.REJECTED,
      },
      { userId: testUser1?._id },
    );

    expect(updatedMembership?.status).toEqual(MembershipStatus.REJECTED);
  });

  it(`updateVolunteerMembership (with group) - set to accepted `, async () => {
    const membership = await VolunteerMembership.findOne({
      status: MembershipStatus.REQUESTED,
      group: testEventVolunteerGroup._id,
      volunteer: testEventVolunteer1?._id,
    });

    const updatedMembership = await updateVolunteerMembership?.(
      {},
      {
        id: membership?._id.toString() ?? "",
        status: MembershipStatus.ACCEPTED,
      },
      { userId: testUser1?._id },
    );

    expect(updatedMembership?.status).toEqual(MembershipStatus.ACCEPTED);
  });
});
