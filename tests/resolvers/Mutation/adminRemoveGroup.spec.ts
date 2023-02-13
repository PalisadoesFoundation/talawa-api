import "dotenv/config";
import { Types } from "mongoose";
import { Organization, GroupChat } from "../../../src/models";
import { MutationAdminRemoveGroupArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { adminRemoveGroup as adminRemoveGroupResolver } from "../../../src/resolvers/Mutation/adminRemoveGroup";
import {
  CHAT_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { testUserType, testOrganizationType } from "../../helpers/userAndOrg";
import {
  testGroupChatType,
  createTestGroupChat,
} from "../../helpers/groupChat";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testGroupChat: testGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestGroupChat();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  testGroupChat = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> adminRemoveGroup", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.groupId`, async () => {
    try {
      const args: MutationAdminRemoveGroupArgs = {
        groupId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === group.organization for
  group with _id === args.groupId`, async () => {
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

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
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

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat!.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError if for user with _id === context.userId is not an
  admin of orgnanization with _id === args.organizationId`, async () => {
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

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes the post and returns it`, async () => {
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

    const args: MutationAdminRemoveGroupArgs = {
      groupId: testGroupChat!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const adminRemoveGroupPayload = await adminRemoveGroupResolver?.(
      {},
      args,
      context
    );

    expect(adminRemoveGroupPayload).toEqual(testGroupChat!.toObject());
  });
});
