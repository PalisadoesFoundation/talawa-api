import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Event, EventAttendee } from "../../../src/models";
import type {
  MutationRegisterForEventArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { registerForEvent as registerForEventResolver } from "../../../src/resolvers/Mutation/registerForEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  REGISTRANT_ALREADY_EXIST_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import { wait } from "./acceptAdmin.spec";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> registerForEvent", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterForEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      const { registerForEvent: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerForEvent"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws error if user with _id === context.userId is already a registrant of event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterForEventArgs = {
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      const { registerForEvent: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerForEvent"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE);
      expect(error.message).toEqual(REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE);
    }
  });

  it(`registers user with _id === context.userId as a registrant for event with _id === args.id`, async () => {
    await EventAttendee.deleteOne({
      userId: testUser!._id,
      eventId: testEvent!._id,
    });

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          registeredEvents: [],
        },
      }
    );

    const args: MutationRegisterForEventArgs = {
      id: testEvent!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const registerForEventPayload = await registerForEventResolver?.(
      {},
      args,
      context
    );

    const testRegisterForEventPayload = await Event.findOne({
      _id: testEvent?._id,
    }).lean();

    expect(registerForEventPayload).toEqual(testRegisterForEventPayload);

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser?.registeredEvents).toEqual([testEvent?._id]);

    await wait();

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.CREATE,
      model: "EventAttendee",
    });
    expect((mostRecentTransactions as TransactionLog[])[1]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "User",
    });
  });
});
