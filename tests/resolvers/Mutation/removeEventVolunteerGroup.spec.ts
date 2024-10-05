import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateEventVolunteerArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
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
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import { EventVolunteer, EventVolunteerGroup } from "../../../src/models";
import { createTestUser } from "../../helpers/user";
import type { TestEventVolunteerGroupType } from "./createEventVolunteer.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let eventAdminUser: TestUserType;
let testEvent: TestEventType;
let testGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  [eventAdminUser, , testEvent] = await createTestEvent();

  testGroup = await EventVolunteerGroup.create({
    creator: eventAdminUser?._id,
    event: testEvent?._id,
    leader: eventAdminUser?._id,
    name: "Test group",
  });

  await EventVolunteer.create({
    creator: eventAdminUser?._id,
    user: testUser?._id,
    event: testEvent?._id,
    group: testGroup._id,
    hasAccepted: false,
    isPublic: false,
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

      const context = { userId: new Types.ObjectId().toString() };

      const { removeEventVolunteerGroup: removeEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeEventVolunteerGroup"
        );

      await removeEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
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
        id: new Types.ObjectId().toString(),
      };

      const context = { userId: testUser?._id };

      const { removeEventVolunteerGroup: removeEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeEventVolunteerGroup"
        );

      await removeEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if current user is not an event admin`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: testGroup?._id,
      };

      const context = { userId: testUser?._id };

      const { removeEventVolunteerGroup: removeEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeEventVolunteerGroup"
        );

      await removeEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`removes event volunteer group with _id === args.id and returns it`, async () => {
    const args: MutationUpdateEventVolunteerArgs = {
      id: testGroup?._id,
    };

    const context = { userId: eventAdminUser?._id };
    const { removeEventVolunteerGroup: removeEventVolunteerGroupResolver } =
      await import("../../../src/resolvers/Mutation/removeEventVolunteerGroup");

    const deletedVolunteerGroup = await removeEventVolunteerGroupResolver?.(
      {},
      args,
      context,
    );

    expect(deletedVolunteerGroup).toEqual(
      expect.objectContaining({
        _id: testGroup?._id,
        leader: testGroup?.leader,
        name: testGroup?.name,
        creator: testGroup?.creator,
        event: testGroup?.event,
      }),
    );
  });
});
