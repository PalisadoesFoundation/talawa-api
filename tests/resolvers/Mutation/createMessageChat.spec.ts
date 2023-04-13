import "dotenv/config";
import mongoose, { Document, Types } from "mongoose";
import { InterfaceUser, User, InterfaceMessageChat } from "../../../src/models";
import { MutationCreateMessageChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
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
      ) => {
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
  });
});
