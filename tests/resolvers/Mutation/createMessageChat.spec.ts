import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceUser, InterfaceMessageChat } from "../../../src/models";
import { TransactionLog, User } from "../../../src/models";
import type { MutationCreateMessageChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  TRANSACTION_LOG_TYPES,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { wait } from "./acceptAdmin.spec";

let testUsers: (InterfaceUser & Document<any, any, InterfaceUser>)[];
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
  ]);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createMessageChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === args.data.receiver`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateMessageChatArgs = {
        data: {
          message: "",
          receiver: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[0].id,
      };

      const { createMessageChat: createMessageChatResolver } = await import(
        "../../../src/resolvers/Mutation/createMessageChat"
      );
      await createMessageChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`creates the organization and returns it`, async () => {
    const args: MutationCreateMessageChatArgs = {
      data: {
        message: "message",
        receiver: testUsers[1].id,
      },
    };

    const pubsub = {
      publish: (
        _action: "CHAT_CHANNEL",
        _payload: {
          directMessageChat: InterfaceMessageChat;
        }
      ): {
        _action: string;
        _payload: { directMessageChat: InterfaceMessageChat };
      } => {
        return { _action, _payload };
      },
    };

    const context = {
      userId: testUsers[0].id,
      pubsub,
    };

    const { createMessageChat: createMessageChatResolver } = await import(
      "../../../src/resolvers/Mutation/createMessageChat"
    );
    const createMessageChatPayload = await createMessageChatResolver?.(
      {},
      args,
      context
    );

    expect(createMessageChatPayload).toEqual(
      expect.objectContaining({
        sender: testUsers[0]._id,
        receiver: testUsers[1]._id,
        message: "message",
        languageBarrier: false,
      })
    );

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(1);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUsers[0]?._id,
      type: TRANSACTION_LOG_TYPES.CREATE,
      modelName: "MessageChat",
    });
  });
});
