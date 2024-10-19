import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceChat } from "../../../src/models";
import { User, Organization, Chat } from "../../../src/models";
import type { MutationMarkChatMessagesAsReadArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { markChatMessagesAsRead as markChatMessagesAsReadResolver } from "../../../src/resolvers/Mutation/markChatMessagesAsRead";
import {
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { createTestUserFunc } from "../../helpers/user";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: TestUserType[];
let testChat: InterfaceChat & Document<unknown, unknown, InterfaceChat>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const tempUser1 = await createTestUserFunc();
  const tempUser2 = await createTestUserFunc();
  testUsers = [tempUser1, tempUser2];

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: testUsers[0]?._id,
    admins: [testUsers[0]?._id],
    members: [testUsers[0]?._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUsers[0]?._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    },
  );

  testChat = await Chat.create({
    name: "Chat",
    creatorId: testUsers[0]?._id,
    organization: testOrganization._id,
    users: [testUsers[0]?._id, testUsers[1]?._id],
    isGroup: false,
    createdAt: "23456789",
    updatedAt: "23456789",
    unseenMessagesByUsers: JSON.stringify({
      [testUsers[0]?._id]: 0,
      [testUsers[1]?._id]: 0,
    }),
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> markChatMessagesAsRead", () => {
  afterEach(async () => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no directChat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationMarkChatMessagesAsReadArgs = {
        chatId: new Types.ObjectId().toString(),
        userId: testUsers[0]?.id,
      };

      const context = { userId: testUsers[0]?.id };

      await markChatMessagesAsReadResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError current user with _id === context.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationMarkChatMessagesAsReadArgs = {
        chatId: testChat.id,
        userId: testUsers[0]?.id,
      };

      const context = {
        userId: "",
      };

      await markChatMessagesAsReadResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`creates the directChatMessage and returns it`, async () => {
    await Chat.updateOne(
      {
        _id: testChat._id,
      },
      {
        $push: {
          users: testUsers[0]?._id,
        },
      },
    );

    const args: MutationMarkChatMessagesAsReadArgs = {
      chatId: testChat.id,
      userId: testUsers[0]?.id,
    };

    const context = {
      userId: testUsers[0]?.id,
    };

    const sendMessageToChatPayload = await markChatMessagesAsReadResolver?.(
      {},
      args,
      context,
    );

    expect(sendMessageToChatPayload).toEqual(
      expect.objectContaining({
        unseenMessagesByUsers: JSON.stringify({
          [testUsers[0]?._id]: 0,
          [testUsers[1]?._id]: 0,
        }),
      }),
    );
  });
});
