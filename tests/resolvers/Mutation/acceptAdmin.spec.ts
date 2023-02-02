import "dotenv/config";
import { Types } from "mongoose";
import { MutationAcceptAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { acceptAdmin as acceptAdminResolver } from "../../../src/resolvers/Mutation/acceptAdmin";
import {
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
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

let testUser: testUserType;

beforeAll(async () => {
  await connect();
  testUser = await createTestUser();
});

afterAll(async () => {
  await disconnect();
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> acceptAdmin", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        id: testUser!.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws Error if user with _id === context.userId is not a SUPERADMIN`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        id: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.id`, async () => {
    try {
      await User.updateOne(
        {
          _id: testUser!._id,
        },
        {
          $set: {
            userType: "SUPERADMIN",
          },
        }
      );

      const args: MutationAcceptAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`makes user with _id === args.id adminApproved and returns true`, async () => {
    const args: MutationAcceptAdminArgs = {
      id: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const acceptAdminPayload = await acceptAdminResolver?.({}, args, context);

    expect(acceptAdminPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["adminApproved"])
      .lean();

    expect(updatedTestUser?.adminApproved).toEqual(true);
  });
});

describe("resolvers -> Mutation -> acceptAdmin [IN_PRODUCTION]", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId [IN_PRODUCTION]`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationAcceptAdminArgs = {
        id: testUser!.id,
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
          IN_PRODUCTION: true,
        };
      });

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      await User.updateOne(
        {
          _id: testUser!._id,
        },
        {
          $set: {
            userType: "SUPERADMIN",
          },
        }
      );

      const args: MutationAcceptAdminArgs = {
        id: Types.ObjectId().toString(),
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

      const { acceptAdmin } = await import(
        "../../../src/resolvers/Mutation/acceptAdmin"
      );
      await acceptAdmin?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });
});
