import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { GroupChat, Organization, User } from "../../../src/models";
import type { MutationAdminRemoveGroupArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { adminRemoveGroup as adminRemoveGroupResolver } from "../../../src/resolvers/Mutation/adminRemoveGroup";
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
  const resultsArray = await createTestGroupChat();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  testGroupChat = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> adminRemoveGroup", () => {
  it("throws an error if the user does not have appUserProfile", async () => {
    try {
      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat?.id,
      };

      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });

      const context = {
        userId: newUser?.id,
      };
      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      // console.log(error);?
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it(`throws NotFoundError if no groupChat exists with _id === args.groupId`, async () => {
    try {
      const args: MutationAdminRemoveGroupArgs = {
        groupId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
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
            organization: new Types.ObjectId().toString(),
          },
        },
      );

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
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
        },
      );

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat?.id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
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
        },
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
        },
      );
      if (updatedOrganization) cacheOrganizations([updatedOrganization]);

      const args: MutationAdminRemoveGroupArgs = {
        groupId: testGroupChat?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ADMIN.MESSAGE,
      );
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
      },
    );
    if (updatedOrganization) cacheOrganizations([updatedOrganization]);

    const args: MutationAdminRemoveGroupArgs = {
      groupId: testGroupChat?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const adminRemoveGroupPayload = await adminRemoveGroupResolver?.(
      {},
      args,
      context,
    );

    expect(adminRemoveGroupPayload).toEqual({
      ...testGroupChat?.toObject(),
      updatedAt: expect.anything(),
    });
  });
});
