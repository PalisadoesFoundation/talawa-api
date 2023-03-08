import "dotenv/config";
import { Types } from "mongoose";
import { MutationCreateDirectChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
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
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> createDirectChat", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError message if no user exists  with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: "",
          userIds: [],
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });
      const { createDirectChat: createDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/createDirectChat"
      );
      await createDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError message if no organization exists  with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          userIds: [],
        },
      };
      const context = {
        userId: testUser!.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { createDirectChat: createDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/createDirectChat"
      );
      await createDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError message if no user exists with _id === context.userIds when [IN_PRODUCTION === TRUE]`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: testOrganization!.id,
          userIds: [Types.ObjectId().toString()],
        },
      };

      const context = {
        userId: testUser!.id,
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });
      const { createDirectChat: createDirectChatResolver } = await import(
        "../../../src/resolvers/Mutation/createDirectChat"
      );
      await createDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`creates the directChat and returns it`, async () => {
    const args: MutationCreateDirectChatArgs = {
      data: {
        organizationId: testOrganization!.id,
        userIds: [testUser!.id],
      },
    };

    const context = {
      userId: testUser!.id,
    };
    const { createDirectChat: createDirectChatResolver } = await import(
      "../../../src/resolvers/Mutation/createDirectChat"
    );

    const createDirectChatPayload = await createDirectChatResolver?.(
      {},
      args,
      context
    );

    expect(createDirectChatPayload).toEqual(
      expect.objectContaining({
        creator: testUser!._id,
        users: [testUser!._id],
        organization: testOrganization!._id,
      })
    );
  });
});
