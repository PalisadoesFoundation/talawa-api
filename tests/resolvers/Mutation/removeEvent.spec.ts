import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import type {
  MutationRemoveEventArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { removeEvent as removeEventResolver } from "../../../src/resolvers/Mutation/removeEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import { cacheEvents } from "../../../src/services/EventCache/cacheEvents";

import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEvent();
  testUser = temp[0];
  testOrganization = temp[1];
  testEvent = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither an
  admin of organization with _id === event.organization for event with _id === args.id
  or an admin for event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $set: {
            adminFor: [],
          },
        }
      );

      await Event.updateOne(
        {
          _id: testEvent?._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRemoveEventArgs = {
        id: testEvent?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeEvent: removeEventResolver } = await import(
        "../../../src/resolvers/Mutation/removeEvent"
      );

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`removes event with _id === args.id and returns it`, async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          adminFor: testOrganization?._id,
        },
      }
    );

    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: testEvent?._id,
      },
      {
        $push: {
          admins: testUser?._id,
        },
      },
      {
        new: true,
      }
    );

    if (updatedEvent !== null) {
      await cacheEvents([updatedEvent]);
    }

    const args: MutationRemoveEventArgs = {
      id: testEvent?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(testEvent?.toObject());

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["createdEvents", "eventAdmin"])
      .lean();

    expect(updatedTestUser?.createdEvents).toEqual([]);
    expect(updatedTestUser?.eventAdmin).toEqual([]);

    const updatedTestEvent = await Event.findOne({
      _id: testEvent?._id,
    })
      .select(["status"])
      .lean();

    expect(updatedTestEvent?.status).toEqual("DELETED");

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.DELETE,
      model: "TaskVolunteer",
    });
    expect((mostRecentTransactions as TransactionLog[])[1]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.DELETE,
      model: "Task",
    });
    expect((mostRecentTransactions as TransactionLog[])[2]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.DELETE,
      model: "EventProject",
    });
    expect((mostRecentTransactions as TransactionLog[])[3]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "Event",
    });
    expect((mostRecentTransactions as TransactionLog[])[4]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "User",
    });
  });
});
