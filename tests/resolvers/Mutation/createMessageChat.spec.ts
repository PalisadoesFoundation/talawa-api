import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Interface_MessageChat,
} from "../../../src/models";
import { MutationCreateMessageChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
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

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];

beforeAll(async () => {
  await connect();

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
  await disconnect();
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { createMessageChat: createMessageChatResolver } = await import(
        "../../../src/resolvers/Mutation/createMessageChat"
      );
      await createMessageChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
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
          directMessageChat: Interface_MessageChat;
        }
      ) => {
        return;
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
