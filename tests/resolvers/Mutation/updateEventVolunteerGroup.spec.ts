import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  MutationUpdateEventVolunteerArgs,
  MutationUpdateEventVolunteerGroupArgs,
} from "../../../src/types/generatedGraphQLTypes";
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
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import { createTestUser } from "../../helpers/user";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestEventVolunteerGroupType } from "./createEventVolunteer.spec";
import { EventVolunteerGroup } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let eventAdminUser: TestUserType;
let testGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [eventAdminUser, , testEvent] = await createTestEvent();
  testGroup = await EventVolunteerGroup.create({
    creatorId: eventAdminUser?._id,
    eventId: testEvent?._id,
    leaderId: eventAdminUser?._id,
    name: "Test group",
    volunteersRequired: 2,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateEventVolunteerGroup", () => {
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
      const args: MutationUpdateEventVolunteerGroupArgs = {
        id: testGroup?._id,
        data: {
          name: "updated name",
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { updateEventVolunteerGroup: updateEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/updateEventVolunteerGroup"
        );

      await updateEventVolunteerGroupResolver?.({}, args, context);
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
      const args: MutationUpdateEventVolunteerGroupArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          name: "updated name",
        },
      };

      const context = { userId: eventAdminUser?._id };

      const { updateEventVolunteerGroup: updateEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/updateEventVolunteerGroup"
        );

      await updateEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if current user is not leader of group `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerGroupArgs = {
        id: testGroup?._id,
        data: {
          name: "updated name",
        },
      };

      const testUser2 = await createTestUser();
      const context = { userId: testUser2?._id };

      const { updateEventVolunteerGroup: updateEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/updateEventVolunteerGroup"
        );

      await updateEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`updates the Event Volunteer group with _id === args.id and returns it`, async () => {
    const args: MutationUpdateEventVolunteerGroupArgs = {
      id: testGroup?._id,
      data: {
        eventId: testEvent?._id,
        volunteersRequired: 10,
        name: "updated",
      },
    };

    const context = { userId: eventAdminUser?._id };

    const { updateEventVolunteerGroup: updateEventVolunteerGroupResolver } =
      await import("../../../src/resolvers/Mutation/updateEventVolunteerGroup");

    const updatedGroup = await updateEventVolunteerGroupResolver?.(
      {},
      args,
      context,
    );

    expect(updatedGroup).toEqual(
      expect.objectContaining({
        name: "updated",
        eventId: testEvent?._id,
        volunteersRequired: 10,
      }),
    );
  });

  it(`updates the Event Volunteer group with _id === args.id, even if args.data is empty object`, async () => {
    const testGroup2 = await EventVolunteerGroup.create({
      name: "test",
      eventId: testEvent?._id,
      creatorId: eventAdminUser?._id,
      volunteersRequired: 2,
      leaderId: eventAdminUser?._id,
    });
    const args: MutationUpdateEventVolunteerArgs = {
      id: testGroup2?._id.toString(),
      data: {},
    };

    const context = { userId: eventAdminUser?._id };

    const { updateEventVolunteerGroup: updateEventVolunteerGroupResolver } =
      await import("../../../src/resolvers/Mutation/updateEventVolunteerGroup");

    const updatedGroup = await updateEventVolunteerGroupResolver?.(
      {},
      args,
      context,
    );

    console.log(updatedGroup);

    console.log();
    expect(updatedGroup).toEqual(
      expect.objectContaining({
        name: testGroup2?.name,
        volunteersRequired: testGroup2?.volunteersRequired,
        eventId: testGroup2?.eventId,
      }),
    );
  });
});
