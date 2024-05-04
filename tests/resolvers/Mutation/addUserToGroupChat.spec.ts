import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { GroupChat, Organization } from "../../../src/models";
import type { MutationAddUserToGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import type { TestGroupChatType } from "../../helpers/groupChat";
import { createTestGroupChat } from "../../helpers/groupChat";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testUser = resultArray[0];
  testOrganization = resultArray[1];
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addUserToGroupChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddUserToGroupChatArgs = {
        chatId: new Types.ObjectId().toString(),
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === groupChat.organization
  for groupChat with _id === args.chatId`, async () => {
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
            organization: new Types.ObjectId().toString(),
          },
        },
      );

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat?.id,
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of organization with _id === groupChat.organization for groupChat
  with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

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

      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
      );

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat?.id,
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?.id,
      };
      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );

      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            admins: testUser?._id,
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat?.id,
        userId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws ConflictError if user with _id === args.userId is already a member 
  of groupChat with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat?.id,
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { addUserToGroupChat } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChat?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_ALREADY_MEMBER_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_ALREADY_MEMBER_ERROR.MESSAGE,
      );
    }
  });

  it(`add the groupChat with _id === args.chatId and returns it`, async () => {
    await GroupChat.updateOne(
      {
        _id: testGroupChat?._id,
      },
      {
        $set: {
          users: [],
        },
      },
    );

    const args: MutationAddUserToGroupChatArgs = {
      chatId: testGroupChat?.id,
      userId: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };
    const { addUserToGroupChat } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    const addUserToGroupChatPayload = await addUserToGroupChat?.(
      {},
      args,
      context,
    );
    expect(addUserToGroupChatPayload?._id).toEqual(testGroupChat?._id);
    expect(addUserToGroupChatPayload?.users).toEqual([testUser?._id]);
  });
});
