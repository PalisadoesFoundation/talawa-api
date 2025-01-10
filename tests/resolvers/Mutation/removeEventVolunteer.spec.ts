import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateEventVolunteerArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import type {
  TestEventType,
  TestEventVolunteerType,
} from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import { EventVolunteer, EventVolunteerGroup } from "../../../src/models";
import { createTestUser } from "../../helpers/user";
import type { TestEventVolunteerGroupType } from "./createEventVolunteer.spec";
import { removeEventVolunteer } from "../../../src/resolvers/Mutation/removeEventVolunteer";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let eventAdminUser: TestUserType;
let testEvent: TestEventType;
let testEventVolunteer: TestEventVolunteerType;
let testGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
  testUser = await createTestUser();
  [eventAdminUser, , testEvent] = await createTestEvent();

  testGroup = await EventVolunteerGroup.create({
    creator: eventAdminUser?._id,
    event: testEvent?._id,
    leader: eventAdminUser?._id,
    name: "Test group",
  });

  testEventVolunteer = await EventVolunteer.create({
    creator: eventAdminUser?._id,
    user: testUser?._id,
    event: testEvent?._id,
    groups: [testGroup?._id],
    hasAccepted: false,
    isPublic: false,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeEventVolunteer", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`removes event volunteer with _id === args.id and returns it`, async () => {
    const args: MutationUpdateEventVolunteerArgs = {
      id: testEventVolunteer?._id,
    };

    const context = { userId: eventAdminUser?._id };

    const deletedVolunteer = await removeEventVolunteer?.({}, args, context);

    const updatedGroup = await EventVolunteerGroup.findOne({
      _id: testGroup?._id,
    });

    expect(updatedGroup?.volunteers.toString()).toEqual("");

    expect(deletedVolunteer).toEqual(
      expect.objectContaining({
        _id: testEventVolunteer?._id,
        user: testEventVolunteer?.user,
        hasAccepted: testEventVolunteer?.hasAccepted,
        isPublic: testEventVolunteer?.isPublic,
      }),
    );
  });

  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: testEventVolunteer?._id,
      };

      const context = { userId: new Types.ObjectId().toString() };

      await removeEventVolunteer?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no event volunteer exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = { userId: testUser?._id };

      await removeEventVolunteer?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if current user is not leader of group`, async () => {
    try {
      const newVolunteer = await EventVolunteer.create({
        creator: eventAdminUser?._id,
        user: testUser?._id,
        event: testEvent?._id,
        groups: [testGroup?._id],
        hasAccepted: false,
        isPublic: false,
      });
      const args: MutationUpdateEventVolunteerArgs = {
        id: newVolunteer?._id.toString(),
      };

      const context = { userId: testUser?._id };

      await removeEventVolunteer?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });
});
