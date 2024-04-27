import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  InterfaceDirectChat,
  InterfaceDirectChatMessage,
} from "../../../src/models";
import { User, Organization, DirectChat } from "../../../src/models";
import type { MutationSendMessageToDirectChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { sendMessageToDirectChat as sendMessageToDirectChatResolver } from "../../../src/resolvers/Mutation/sendMessageToDirectChat";
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
let testDirectChat: InterfaceDirectChat &
  Document<unknown, unknown, InterfaceDirectChat>;

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

  testDirectChat = await DirectChat.create({
    title: "title",
    creatorId: testUsers[0]?._id,
    organization: testOrganization._id,
    users: [testUsers[0]?._id, testUsers[1]?._id],
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> sendMessageToDirectChat", () => {
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
      const args: MutationSendMessageToDirectChatArgs = {
        chatId: new Types.ObjectId().toString(),
        messageContent: "",
      };

      const context = { userId: testUsers[0]?.id };

      const { sendMessageToDirectChat: sendMessageToDirectChatResolver } =
        await import("../../../src/resolvers/Mutation/sendMessageToDirectChat");

      await sendMessageToDirectChatResolver?.({}, args, context);
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
      const args: MutationSendMessageToDirectChatArgs = {
        chatId: testDirectChat.id,
        messageContent: "",
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { sendMessageToDirectChat: sendMessageToDirectChatResolver } =
        await import("../../../src/resolvers/Mutation/sendMessageToDirectChat");

      await sendMessageToDirectChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`creates the directChatMessage and returns it`, async () => {
    await DirectChat.updateOne(
      {
        _id: testDirectChat._id,
      },
      {
        $push: {
          users: testUsers[0]?._id,
        },
      },
    );

    const args: MutationSendMessageToDirectChatArgs = {
      chatId: testDirectChat.id,
      messageContent: "messageContent",
    };

    const pubsub = {
      publish: (
        _action: "MESSAGE_SENT_TO_DIRECT_CHAT",
        _payload: {
          messageSentToDirectChat: InterfaceDirectChatMessage;
        },
      ): {
        _action: string;
        _payload: { messageSentToDirectChat: InterfaceDirectChatMessage };
      } => {
        return { _action, _payload };
      },
    };

    const context = {
      userId: testUsers[0]?.id,
      pubsub,
    };

    const sendMessageToDirectChatPayload =
      await sendMessageToDirectChatResolver?.({}, args, context);

    expect(sendMessageToDirectChatPayload).toEqual(
      expect.objectContaining({
        directChatMessageBelongsTo: testDirectChat._id,
        sender: testUsers[0]?._id,
        receiver: testUsers[1]?._id,
        messageContent: "messageContent",
      }),
    );
  });
});
