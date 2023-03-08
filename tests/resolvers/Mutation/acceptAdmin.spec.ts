import "dotenv/config";
import { Types } from "mongoose";
import { MutationAcceptAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { acceptAdmin as acceptAdminResolver } from "../../../src/resolvers/Mutation/acceptAdmin";
import {
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createTestUser, testUserType } from "../../helpers/userAndOrg";
import { User } from "../../../src/models";

let testUserSuperAdmin: testUserType;
let testUserAdmin: testUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUserSuperAdmin = await createTestUser();
  testUserAdmin = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> acceptAdmin", () => {
  it(`throws not found error when user with _id === context.userId is null`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationAcceptAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws user is not Authorised Error if user is not SuperAdmin`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationAcceptAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUserSuperAdmin?.id,
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`
      );
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
      id: testUserAdmin!.id,
    };

    const context = {
      userId: testUserSuperAdmin!.id,
    };

    const acceptAdminPayload = await acceptAdminResolver?.({}, args, context);

    expect(acceptAdminPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUserAdmin!._id,
    })
      .select(["adminApproved"])
      .lean();

    expect(updatedTestUser?.adminApproved).toEqual(true);
  });

  it(`throws not found error when user with _id === args._id is null`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationAcceptAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUserSuperAdmin?.id,
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
});
