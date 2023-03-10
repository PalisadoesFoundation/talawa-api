import "dotenv/config";
import { Types } from "mongoose";
import { Organization, GroupChat, GroupChatMessage } from "../../../src/models";
import { MutationRemoveGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
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
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";
import {
  createTestGroupChatMessage,
  testGroupChatType,
} from "../../helpers/groupChat";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;
let testGroupChat: testGroupChatType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestGroupChatMessage();
  testUser = temp[0];
  testOrganization = temp[1];
  testGroupChat = temp[2];
  const testGroupChatMessage = temp[3];
  testGroupChat = await GroupChat.findOneAndUpdate(
    {
      _id: testGroupChat!._id,
    },
    {
      $push: {
        messages: testGroupChatMessage!._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> removeGroupChat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveGroupChatArgs = {
        chatId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };
      const { removeGroupChat: removeGroupChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeGroupChat"
      );

      await removeGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${CHAT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no organization exists with _id === groupChat.organization
  for field organization of groupChat with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat!._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRemoveGroupChatArgs = {
        chatId: testGroupChat!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeGroupChat: removeGroupChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeGroupChat"
      );

      await removeGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of organization with _id === groupChat.organization for groupChat
  with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat!._id,
        },
        {
          $set: {
            organization: testOrganization!._id,
          },
        }
      );

      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRemoveGroupChatArgs = {
        chatId: testGroupChat!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeGroupChat: removeGroupChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeGroupChat"
      );

      await removeGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`
      );
    }
  });

  it(`deletes the groupChat with _id === args.chatId and all groupChatMessages
  associated to it and returns it`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $push: {
          admins: testUser!._id,
        },
      }
    );

    const args: MutationRemoveGroupChatArgs = {
      chatId: testGroupChat!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const { removeGroupChat: removeGroupChatResolver } = await import(
      "../../../src/resolvers/Mutation/removeGroupChat"
    );

    const removeGroupChatPayload = await removeGroupChatResolver?.(
      {},
      args,
      context
    );

    expect(removeGroupChatPayload).toEqual(testGroupChat!.toObject());

    const testDeletedGroupChatMessages = await GroupChatMessage.find({
      groupChatMessageBelongsTo: testGroupChat!._id,
    }).lean();

    expect(testDeletedGroupChatMessages).toEqual([]);
  });
});
