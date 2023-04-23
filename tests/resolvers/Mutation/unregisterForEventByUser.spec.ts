import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import type { MutationUnregisterForEventByUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_UNREGISTERED_ERROR,
  USER_NOT_FOUND_ERROR,
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

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEvent();
  testUser = temp[0];
  testEvent = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> unregisterForEventByUser", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { unregisterForEventByUser: unregisterForEventByUserResolver } =
        await import(
          "../../../src/resolvers/Mutation/unregisterForEventByUser"
        );

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      const { unregisterForEventByUser: unregisterForEventByUserResolver } =
        await import(
          "../../../src/resolvers/Mutation/unregisterForEventByUser"
        );

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if current user with _id === context.userId is
  not a registrant of event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      const { unregisterForEventByUser: unregisterForEventByUserResolver } =
        await import(
          "../../../src/resolvers/Mutation/unregisterForEventByUser"
        );

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`unregisters current user with _id === context.userId from event with
  _id === args.id`, async () => {
    await Event.updateOne(
      {
        _id: testEvent!._id,
      },
      {
        $push: {
          registrants: {
            userId: testUser!._id,
            user: testUser!._id,
            status: "ACTIVE",
          },
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $push: {
          registeredEvents: testEvent!._id,
        },
      }
    );

    const args: MutationUnregisterForEventByUserArgs = {
      id: testEvent!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const { unregisterForEventByUser: unregisterForEventByUserResolver } =
      await import("../../../src/resolvers/Mutation/unregisterForEventByUser");

    const unregisterForEventByUserPayload =
      await unregisterForEventByUserResolver?.({}, args, context);

    const testUnregisterForEventByUserPayload = await Event.findOne({
      _id: testEvent!._id,
    }).lean();

    expect(unregisterForEventByUserPayload).toEqual(
      testUnregisterForEventByUserPayload
    );
  });

  it(`throws NotFoundError if current user with _id === context.userId has
  already unregistered from the event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      const { unregisterForEventByUser: unregisterForEventByUserResolver } =
        await import(
          "../../../src/resolvers/Mutation/unregisterForEventByUser"
        );

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_ALREADY_UNREGISTERED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_ALREADY_UNREGISTERED_ERROR.MESSAGE}`
      );
    }
  });
});
