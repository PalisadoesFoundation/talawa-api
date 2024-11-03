import "dotenv/config";
import type mongoose from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../src/constants";

import type { InterfaceUser } from "../../src/models";
import { AppUserProfile, VolunteerMembership } from "../../src/models";
import { connect, disconnect } from "../helpers/db";
import type { TestUserType } from "../helpers/userAndOrg";
import { requestContext } from "../../src/libraries";
import {
  checkAppUserProfileExists,
  checkEventVolunteerExists,
  checkUserExists,
  checkVolunteerGroupExists,
  checkVolunteerMembershipExists,
} from "../../src/utilities/checks";
import { createTestUser } from "../helpers/user";
import { createVolunteerAndActions } from "../helpers/volunteers";
import type { TestEventVolunteerType } from "../helpers/events";
import type { TestEventVolunteerGroupType } from "../resolvers/Mutation/createEventVolunteer.spec";

let randomUser: InterfaceUser;
let testUser: TestUserType;
let testVolunteer: TestEventVolunteerType;
let testGroup: TestEventVolunteerGroupType;
let MONGOOSE_INSTANCE: typeof mongoose;

const expectError = async (
  fn: () => Promise<unknown>,
  expectedMessage: string,
): Promise<void> => {
  const spy = vi
    .spyOn(requestContext, "translate")
    .mockImplementationOnce((message) => `Translated ${message}`);

  try {
    await fn();
  } catch (error: unknown) {
    expect((error as Error).message).toEqual(`Translated ${expectedMessage}`);
  }

  expect(spy).toBeCalledWith(expectedMessage);
};

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const [, , user1, , volunteer1, , volunteerGroup] =
    await createVolunteerAndActions();

  testUser = user1;
  testVolunteer = volunteer1;
  testGroup = volunteerGroup;

  randomUser = (await createTestUser()) as InterfaceUser;
  await AppUserProfile.deleteOne({
    userId: randomUser._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("utilities -> checks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("checkUserExists -> invalid userId", async () => {
    await expectError(
      () => checkUserExists(testUser?.appUserProfileId),
      USER_NOT_FOUND_ERROR.MESSAGE,
    );
  });

  it("checkUserExists -> valid userId", async () => {
    expect((await checkUserExists(testUser?._id))._id).toEqual(testUser?._id);
  });

  it("checkAppUserProfileExists -> unauthorized user", async () => {
    await expectError(
      () => checkAppUserProfileExists(randomUser),
      USER_NOT_AUTHORIZED_ERROR.MESSAGE,
    );
  });

  it("checkAppUserProfileExists -> authorized user", async () => {
    expect(
      (await checkAppUserProfileExists(testUser as InterfaceUser)).userId,
    ).toEqual(testUser?._id);
  });

  it("checkEventVolunteerExists -> invalid volunteerId", async () => {
    await expectError(
      () => checkEventVolunteerExists(testUser?._id),
      EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE,
    );
  });

  it("checkEventVolunteerExists -> valid volunteerId", async () => {
    expect((await checkEventVolunteerExists(testVolunteer?._id))._id).toEqual(
      testVolunteer?._id,
    );
  });

  it("checkVolunteerGroupExists -> invalid groupId", async () => {
    await expectError(
      () => checkVolunteerGroupExists(testUser?._id),
      EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
    );
  });

  it("checkVolunteerGroupExists -> valid groupId", async () => {
    expect((await checkVolunteerGroupExists(testGroup?._id))._id).toEqual(
      testGroup?._id,
    );
  });

  it("checkVolunteerMembershipExists -> invalid membershipId", async () => {
    await expectError(
      () => checkVolunteerMembershipExists(testUser?._id),
      EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR.MESSAGE,
    );
  });

  it("checkVolunteerMembershipExists -> valid membershipId", async () => {
    const volunteerMembership = await VolunteerMembership.create({
      event: testVolunteer?._id,
      volunteer: testUser?._id,
      status: "invited",
    });
    expect(
      (
        await checkVolunteerMembershipExists(
          volunteerMembership?._id.toString(),
        )
      )._id,
    ).toEqual(volunteerMembership?._id);
  });
});
