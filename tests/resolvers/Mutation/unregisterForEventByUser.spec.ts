import "dotenv/config";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import { MutationUnregisterForEventByUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { unregisterForEventByUser as unregisterForEventByUserResolver } from "../../../src/resolvers/Mutation/unregisterForEventByUser";
import {
  EVENT_NOT_FOUND,
  USER_ALREADY_UNREGISTERED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestEvent, testEventType } from "../../helpers/events";

let testUser: testUserType;
let testEvent: testEventType;

beforeAll(async () => {
  await connect();
  const temp = await createTestEvent();
  testUser = temp[0];
  testEvent = temp[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> unregisterForEventByUser", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if current user with _id === context.userId is
  not a registrant of event with _id === args.id`, async () => {
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
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
    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_ALREADY_UNREGISTERED);
    }
  });
});
