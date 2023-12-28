import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization, GroupChat, TransactionLog } from "../../../src/models";
import type { MutationAdminRemoveGroupArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { adminRemoveGroup as adminRemoveGroupResolver } from "../../../src/resolvers/Mutation/adminRemoveGroup";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import type { TestGroupChatType } from "../../helpers/groupChat";
import { createTestGroupChat } from "../../helpers/groupChat";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import { wait } from "./acceptAdmin.spec";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

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
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> adminRemoveGroup", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.groupId`, async () => {
    try {
      const args: MutationAdminRemoveGroupArgs = {
        groupId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === group.organization for
  group with _id === args.groupId`, async () => {
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat?._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
          },
        }
      );

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if for user with _id === context.userId is not an
  admin of orgnanization with _id === args.organizationId`, async () => {
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
          },
        }
      );

      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
        {
          new: true,
        }
      );

      cacheOrganizations([updatedOrganization!]);

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });

  it(`deletes the post and returns it`, async () => {
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
      }
    );

    cacheOrganizations([updatedOrganization!]);

    const args: MutationAdminRemoveGroupArgs = {
      groupId: testGroupChat?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const adminRemoveGroupPayload = await adminRemoveGroupResolver?.(
      {},
      args,
      context
    );

    expect(adminRemoveGroupPayload).toEqual({
      ...testGroupChat?.toObject(),
      updatedAt: expect.anything(),
    });

    await wait();

    const mostRecentTransaction = await TransactionLog.findOne().sort({
      createdAt: -1,
    });

    expect(mostRecentTransaction).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.DELETE,
      modelName: "GroupChat",
    });
  });
});
