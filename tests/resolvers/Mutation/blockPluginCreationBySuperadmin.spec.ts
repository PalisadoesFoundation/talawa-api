import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, User } from "../../../src/models";
import type { MutationBlockPluginCreationBySuperadminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { nanoid } from "nanoid";
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
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { blockPluginCreationBySuperadmin as blockPluginCreationBySuperadminResolver } from "../../../src/resolvers/Mutation/blockPluginCreationBySuperadmin";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> blockPluginCreationBySuperadmin", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: testUser?.id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throws error if user  does not have AppUserProfile", async () => {
    try {
      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: newUser?.id,
      };
      await AppUserProfile.updateOne(
        {
          userId: testUser?._id,
        },
        {
          isSuperAdmin: true,
        },
      );

      const context = {
        userId: testUser?.id,
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: unknown) {
      // console.log((error as Error).message);

      expect((error as Error).message).toEqual(
        `${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
  it("throws error if current appUser does not have AppUserProfile", async () => {
    try {
      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: testUser?.id,
      };

      const context = {
        userId: newUser?.id,
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: unknown) {
      // console.log((error as Error).message);

      expect((error as Error).message).toEqual(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  a SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?.id,
      };
      // console.log(testUser)

      const {
        blockPluginCreationBySuperadmin: blockPluginCreationBySuperadminError,
      } = await import(
        "../../../src/resolvers/Mutation/blockPluginCreationBySuperadmin"
      );

      await blockPluginCreationBySuperadminError?.({}, args, context);
    } catch (error: unknown) {
      // console.log(`-----------------${(error as Error).message}`);
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`depending on args.blockUser blocks/unblocks plugin creation for user
  with _id === args.userId and returns the user`, async () => {
    await AppUserProfile.updateOne(
      {
        userId: testUser?._id,
      },
      {
        isSuperAdmin: true,
      },
    );

    const args: MutationBlockPluginCreationBySuperadminArgs = {
      blockUser: true,
      userId: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const blockPluginCreationBySuperadminPayload =
      await blockPluginCreationBySuperadminResolver?.({}, args, context);

    const testUpdatedTestUser = await AppUserProfile.findOne({
      userId: testUser?._id,
    }).lean();

    expect(blockPluginCreationBySuperadminPayload).toEqual(testUpdatedTestUser);
  });
});
