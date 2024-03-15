import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationAcceptAdminArgs } from "../../../src/types/generatedGraphQLTypes";
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
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile } from "../../../src/models";
import { acceptAdmin as acceptAdminResolver } from "../../../src/resolvers/Mutation/acceptAdmin";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

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
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationAcceptAdminArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
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
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUserSuperAdmin?.id,
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`makes user with _id === args.id adminApproved and returns true`, async () => {
    await AppUserProfile.updateOne(
      {
        userId: testUserSuperAdmin?._id,
      },
      {
        $set: {
          isSuperAdmin: true,
        },
      },
    );
    await AppUserProfile.updateOne(
      {
        userId: testUserAdmin?._id,
      },
      {
        $set: {
          adminApproved: true,
        },
      },
    );

    const args: MutationAcceptAdminArgs = {
      id: testUserAdmin?.id,
    };

    const context = {
      userId: testUserSuperAdmin?.id,
    };

    const acceptAdminPayload = await acceptAdminResolver?.({}, args, context);

    expect(acceptAdminPayload).toEqual(true);

    const updatedTestUser = await AppUserProfile.findOne({
      userId: testUserAdmin?._id,
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
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUserSuperAdmin?.id,
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
  it("throws an error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const testUser = await createTestUser();
      const args: MutationAcceptAdminArgs = {
        id: new Types.ObjectId().toString(),
      };
      await AppUserProfile.deleteOne({
        userId: testUser?.id,
      });
      const context = {
        userId: testUser?.id,
      };

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });
});
