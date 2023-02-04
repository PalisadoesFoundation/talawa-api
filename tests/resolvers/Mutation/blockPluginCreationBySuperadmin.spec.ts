import "dotenv/config";
import { User } from "../../../src/models";
import { Types } from "mongoose";
import { MutationBlockPluginCreationBySuperadminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { blockPluginCreationBySuperadmin as blockPluginCreationBySuperadminResolver } from "../../../src/resolvers/Mutation/blockPluginCreationBySuperadmin";
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType, createTestUser } from "../../helpers/userAndOrg";

let testUser: testUserType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  testUser = await createTestUser();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> blockPluginCreationBySuperadmin", () => {
  it(`throws NotFoundError if no user exists with with _id === args.userId`, async () => {
    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: testUser!.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  a SUPERADMIN`, async () => {
    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`depending on args.blockUser blocks/unblocks plugin creation for user
  with _id === args.userId and returns the user`, async () => {
    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        userType: "SUPERADMIN",
      }
    );

    const args: MutationBlockPluginCreationBySuperadminArgs = {
      blockUser: true,
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const blockPluginCreationBySuperadminPayload =
      await blockPluginCreationBySuperadminResolver?.({}, args, context);

    const testUpdatedTestUser = await User.findOne({
      _id: testUser!.id,
    }).lean();

    expect(blockPluginCreationBySuperadminPayload).toEqual(testUpdatedTestUser);
  });
});
