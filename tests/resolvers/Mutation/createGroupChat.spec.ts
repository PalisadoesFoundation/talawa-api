import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { createGroupChat as createGroupChatResolver } from "../../../src/resolvers/Mutation/createGroupChat";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createGroupChat", () => {
  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateGroupChatArgs = {
        data: {
          organizationId: new Types.ObjectId().toString(),
          title: "",
          userIds: [],
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists for any one of the ids in args.data.userIds`, async () => {
    try {
      const args: MutationCreateGroupChatArgs = {
        data: {
          organizationId: testOrganization?.id,
          title: "",
          userIds: [new Types.ObjectId().toString()],
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`creates the groupChat and returns it`, async () => {
    const args: MutationCreateGroupChatArgs = {
      data: {
        organizationId: testOrganization?.id,
        title: "title",
        userIds: [testUser?.id],
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const createGroupChatPayload = await createGroupChatResolver?.(
      {},
      args,
      context,
    );

    expect(createGroupChatPayload).toEqual(
      expect.objectContaining({
        title: "title",
        creatorId: testUser?._id,
        users: [testUser?._id],
        organization: testOrganization?._id,
      }),
    );
  });
});
