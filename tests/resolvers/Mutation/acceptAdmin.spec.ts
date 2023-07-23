import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationAcceptAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { acceptAdmin as acceptAdminResolver } from "../../../src/resolvers/Mutation/acceptAdmin";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { User } from "../../../src/models";

let testUserSuperAdmin: TestUserType;
let testUserAdmin: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUserSuperAdmin = await createTestUser();
  testUserAdmin = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> acceptAdmin", () => {
  it(`throws not found error when user with _id === context.userId is null`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        input: {
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      const res = await acceptAdmin?.({}, args, context);

      expect(res).toEqual({
        data: false,
        errors: [
          {
            __typename: "UnauthenticatedError",
            message: "user.notFound",
            path: [USER_NOT_FOUND_ERROR.PARAM],
          },
        ],
      });
    } catch (error: any) {
      console.log(error);
    }
  });

  it(`throws user is not Authorised Error if user is not SuperAdmin`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        input: {
          userId: testUserAdmin!.id,
        },
      };

      const context = {
        userId: testUserSuperAdmin?.id,
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: any) {
      console.log(error);
    }
  });

  it(`makes user with _id === args.id adminApproved and returns true`, async () => {
    await User.updateOne(
      {
        _id: testUserSuperAdmin?._id,
      },
      {
        $set: {
          userType: "SUPERADMIN",
          adminApproved: true,
        },
      }
    );

    const args: MutationAcceptAdminArgs = {
      input: {
        userId: testUserAdmin?.id,
      },
    };

    const context = {
      userId: testUserSuperAdmin?.id,
    };

    const acceptAdminPayload = await acceptAdminResolver?.({}, args, context);

    expect(acceptAdminPayload).toEqual({
      data: true,
      errors: [],
    });

    const updatedTestUser = await User.findOne({
      _id: testUserAdmin?._id,
    })
      .select(["adminApproved"])
      .lean();

    expect(updatedTestUser?.adminApproved).toEqual(true);
  });

  it(`throws not found error when user with _id === args._id is null`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        input: {
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUserSuperAdmin?.id,
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );

      const res = await acceptAdmin?.({}, args, context);

      expect(res).toEqual({
        data: false,
        errors: [
          {
            __typename: "UserNotFoundError",
            message: "user.notFound",
            path: ["user"],
          },
        ],
      });
    } catch (error: any) {
      console.log(error);
    }
  });
});
