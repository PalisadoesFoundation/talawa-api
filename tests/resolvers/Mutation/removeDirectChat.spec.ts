import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  Organization,
  DirectChat,
  DirectChatMessage,
} from "../../../src/models";
import type { MutationRemoveDirectChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  ORGANIZATION_NOT_FOUND_ERROR,
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestDirectChatType } from "../../helpers/directChat";
import { createTestDirectChat } from "../../helpers/directChat";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testDirectChat: TestDirectChatType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestDirectChat();
  testUser = temp[0];
  testOrganization = temp[1];

  testDirectChat = await DirectChat.create({
    users: [testUser!._id],
    creator: testUser!._id,
    organization: testOrganization!._id,
  });

  const testDirectChatMessage = temp[2];

  testDirectChat = await DirectChat.findOneAndUpdate(
    {
      _id: testDirectChat._id,
    },
    {
      $push: {
        messages: testDirectChatMessage!._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeDirectChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: "",
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no directChat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: Types.ObjectId().toString(),
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${CHAT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
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

      const args: MutationRemoveDirectChatArgs = {
        chatId: testDirectChat!.id,
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeDirectChat: removeDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/removeDirectChat"
      );
      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`
      );

      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });

  it(`deletes the directChat with _id === args.chatId`, async () => {
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

    const args: MutationRemoveDirectChatArgs = {
      chatId: testDirectChat!.id,
      organizationId: testOrganization!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const { removeDirectChat: removeDirectChatResolver } = await import(
      "../../../src/resolvers/Mutation/removeDirectChat"
    );
    const removeDirectChatPayload = await removeDirectChatResolver?.(
      {},
      args,
      context
    );

    expect(removeDirectChatPayload).toEqual(testDirectChat?.toObject());

    const testDeletedDirectChatMessages = await DirectChatMessage.find({
      directChatMessageBelongsTo: testDirectChat!._id,
    }).lean();

    expect(testDeletedDirectChatMessages).toEqual([]);
  });
});
