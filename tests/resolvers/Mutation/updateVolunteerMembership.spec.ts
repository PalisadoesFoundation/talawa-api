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
import { VolunteerMembership } from "../../../src/models";
import { updateVolunteerMembership } from "../../../src/resolvers/Mutation/updateVolunteerMembership";

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

describe("resolvers -> Mutation -> updateVolunteerMembership", () => {
  it(`updateVolunteerMembership (with group) - set to accepted `, async () => {
    const membership = await VolunteerMembership.findOne({
      status: "requested",
      group: testEventVolunteerGroup._id,
      volunteer: testEventVolunteer1?._id,
    });

    const updatedMembership = await updateVolunteerMembership?.(
      {},
      { id: membership?._id.toString() ?? "", status: "accepted" },
      { userId: testUser1?._id },
    );

    expect(updatedMembership?.status).toEqual("accepted");
  });
});
