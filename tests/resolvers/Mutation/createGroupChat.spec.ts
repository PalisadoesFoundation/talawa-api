import "dotenv/config";
import { Types } from "mongoose";
import { MutationCreateGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createGroupChat as createGroupChatResolver } from "../../../src/resolvers/Mutation/createGroupChat";
import { ORGANIZATION_NOT_FOUND, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testOrganizationType,
  testUserType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  const resultsArray = await createTestUserAndOrganization();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createGroupChat", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateGroupChatArgs = {
        data: {
          organizationId: "",
          title: "",
          userIds: [],
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateGroupChatArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          title: "",
          userIds: [],
        },
      };

      const context = {
        userId: testUser!.id,
      };

      await createGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists for any one of the ids in args.data.userIds`, async () => {
    try {
      const args: MutationCreateGroupChatArgs = {
        data: {
          organizationId: testOrganization!.id,
          title: "",
          userIds: [Types.ObjectId().toString()],
        },
      };

      const context = {
        userId: testUser!.id,
      };

      await createGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`creates the groupChat and returns it`, async () => {
    const args: MutationCreateGroupChatArgs = {
      data: {
        organizationId: testOrganization!.id,
        title: "title",
        userIds: [testUser!.id],
      },
    };

    const context = {
      userId: testUser!.id,
    };

    const createGroupChatPayload = await createGroupChatResolver?.(
      {},
      args,
      context
    );

    expect(createGroupChatPayload).toEqual(
      expect.objectContaining({
        title: "title",
        creator: testUser!._id,
        users: [testUser!._id],
        organization: testOrganization!._id,
      })
    );
  });
});
