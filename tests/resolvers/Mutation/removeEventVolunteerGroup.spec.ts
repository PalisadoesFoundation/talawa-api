import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateEventVolunteerArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
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
  TestEventVolunteerType} from "../../helpers/events";
import {
  createTestEvent,
} from "../../helpers/events";
import { EventVolunteer, EventVolunteerGroup } from "../../../src/models";
import { createTestUser } from "../../helpers/user";
import type { TestEventVolunteerGroupType } from "./createEventVolunteer.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let eventAdminUser: TestUserType;
let testEvent: TestEventType;
let testEventVolunteer: TestEventVolunteerType;
let testGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  [eventAdminUser, , testEvent] = await createTestEvent();

  testGroup = await EventVolunteerGroup.create({
    creatorId: eventAdminUser?._id,
    eventId: testEvent?._id,
    leaderId: eventAdminUser?._id,
    name: "Test group",
  });

  testEventVolunteer = await EventVolunteer.create({
    creatorId: eventAdminUser?._id,
    userId: testUser?._id,
    eventId: testEvent?._id,
    groupId: testGroup._id,
    isInvited: true,
    isAssigned: false,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeEventVolunteerGroup", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: testGroup?._id,
      };

      const context = { userId: Types.ObjectId().toString() };

      const { removeEventVolunteerGroup: removeEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeEventVolunteerGroup"
        );

      await removeEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no event volunteer group exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = { userId: testUser?._id };

      const { removeEventVolunteerGroup: removeEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeEventVolunteerGroup"
        );

      await removeEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE
      );
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`removes event volunteer with _id === args.id and returns it`, async () => {
    const args: MutationUpdateEventVolunteerArgs = {
      id: testEventVolunteer?._id,
    };

    const context = { userId: testUser?._id };
    const { removeEventVolunteerGroup: removeEventVolunteerGroupResolver } =
      await import("../../../src/resolvers/Mutation/removeEventVolunteerGroup");

    const deletedVolunteer = await removeEventVolunteerGroupResolver?.(
      {},
      args,
      context
    );

    const updatedGroup = await EventVolunteerGroup.findOne({
      _id: testGroup?._id,
    });

    expect(updatedGroup?.volunteers.toString()).toEqual("");

    expect(deletedVolunteer).toEqual(
      expect.objectContaining({
        _id: testEventVolunteer?._id,
        userId: testEventVolunteer?.userId,
        isInvited: testEventVolunteer?.isInvited,
        isAssigned: testEventVolunteer?.isAssigned,
        response: testEventVolunteer?.response,
      })
    );
  });
});
