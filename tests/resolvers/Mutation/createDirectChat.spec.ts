import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateDirectChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
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
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createDirectChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError message if no organization exists  with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: new Types.ObjectId().toString(),
          userIds: [],
        },
      };
      const context = {
        userId: testUser?.id,
      };

      const { createDirectChat: createDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/createDirectChat"
      );
      await createDirectChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError message if no user exists with _id === context.userIds`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: testOrganization?.id,
          userIds: [new Types.ObjectId().toString()],
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createDirectChat: createDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/createDirectChat"
      );
      await createDirectChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`creates the directChat and returns it`, async () => {
    const args: MutationCreateDirectChatArgs = {
      data: {
        organizationId: testOrganization?.id,
        userIds: [testUser?.id],
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createDirectChat: createDirectChatResolver } = await import(
      "../../../src/resolvers/Mutation/createDirectChat"
    );

    const createDirectChatPayload = await createDirectChatResolver?.(
      {},
      args,
      context,
    );

    expect(createDirectChatPayload).toEqual(
      expect.objectContaining({
        creatorId: testUser?._id,
        users: [testUser?._id],
        organization: testOrganization?._id,
      }),
    );
  });
});
