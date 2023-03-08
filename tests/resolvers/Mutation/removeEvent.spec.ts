import "dotenv/config";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import { MutationRemoveEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { removeEvent as removeEventResolver } from "../../../src/resolvers/Mutation/removeEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";
import { createTestEvent, testEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;
let testEvent: testEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEvent();
  testUser = temp[0];
  testOrganization = temp[1];
  testEvent = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> removeEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: MutationRemoveEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither an
  admin of organization with _id === event.organization for event with _id === args.id
  or an admin for event with _id === args.id`, async () => {
    try {
      await User.updateOne(
        {
          _id: testUser!._id,
        },
        {
          $set: {
            adminFor: [],
          },
        }
      );

      await Event.updateOne(
        {
          _id: testEvent!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRemoveEventArgs = {
        id: testEvent!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.DESC);
    }
  });

  it(`removes event with _id === args.id and returns it`, async () => {
    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $push: {
          adminFor: testOrganization!._id,
        },
      }
    );

    await Event.updateOne(
      {
        _id: testEvent!._id,
      },
      {
        $push: {
          admins: testUser!._id,
        },
      }
    );

    const args: MutationRemoveEventArgs = {
      id: testEvent!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(testEvent!.toObject());

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["createdEvents", "eventAdmin"])
      .lean();

    expect(updatedTestUser!.createdEvents).toEqual([]);
    expect(updatedTestUser!.eventAdmin).toEqual([]);

    const updatedTestEvent = await Event.findOne({
      _id: testEvent!._id,
    })
      .select(["status"])
      .lean();

    expect(updatedTestEvent!.status).toEqual("DELETED");
  });
});
