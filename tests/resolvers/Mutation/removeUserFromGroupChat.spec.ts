import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, GroupChat } from "../../../src/models";
import type { MutationRemoveUserFromGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { removeUserFromGroupChat as removeUserFromGroupChatResolver } from "../../../src/resolvers/Mutation/removeUserFromGroupChat";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestGroupChatType } from "../../helpers/groupChat";
import { createTestGroupChatMessage } from "../../helpers/groupChat";
import { deleteOrganizationFromCache } from "../../../src/services/OrganizationCache/deleteOrganizationFromCache";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testGroupChat: TestGroupChatType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestGroupChatMessage();
  testUser = temp[0];
  testOrganization = temp[1];
  testGroupChat = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeUserFromGroupChat", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: new Types.ObjectId().toString(),
        userId: "",
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeUserFromGroupChat: removeUserFromGroupChatResolver } =
        await import("../../../src/resolvers/Mutation/removeUserFromGroupChat");

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      console.log((error as Error).message);
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
    an admin of the organization of groupChat with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
          },
        },
      );

      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: testGroupChat?.id,
        userId: "",
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeUserFromGroupChat: removeUserFromGroupChatResolver } =
        await import("../../../src/resolvers/Mutation/removeUserFromGroupChat");

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if users field of groupChat with _id === args.chatId
    does not contain user with _id === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            admins: testUser?._id,
          },
        },
      );

      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $push: {
            adminFor: testOrganization?._id,
          },
        },
      );

      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: testGroupChat?.id,
        userId: "",
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeUserFromGroupChat: removeUserFromGroupChatResolver } =
        await import("../../../src/resolvers/Mutation/removeUserFromGroupChat");

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`removes user with _id === args.userId from users list field of groupChat
  with _id === args.ChatId and returns the updated groupChat`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );

    await GroupChat.updateOne(
      {
        _id: testGroupChat?._id,
      },
      {
        $push: {
          users: testUser?._id,
        },
      },
    );

    const args: MutationRemoveUserFromGroupChatArgs = {
      chatId: testGroupChat?.id,
      userId: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const removeUserFromGroupChatPayload =
      await removeUserFromGroupChatResolver?.({}, args, context);

    const testRemoveUserFromGroupChatPayload = await GroupChat.findOne({
      _id: testGroupChat?._id,
    }).lean();

    expect(removeUserFromGroupChatPayload).toEqual(
      testRemoveUserFromGroupChatPayload,
    );
  });

  it(`throws NotFoundError if no organization exists for groupChat with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const deletedOrgaization = await Organization.findOneAndDelete({
      _id: testOrganization?._id,
    });
    if (deletedOrgaization)
      await deleteOrganizationFromCache(deletedOrgaization);

    try {
      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: testGroupChat?.id,
        userId: "",
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeUserFromGroupChat: removeUserFromGroupChatResolver } =
        await import("../../../src/resolvers/Mutation/removeUserFromGroupChat");

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
});
