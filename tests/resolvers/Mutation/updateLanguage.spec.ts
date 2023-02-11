import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationUpdateLanguageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { updateLanguage as updateLanguageResolver } from "../../../src/resolvers/Mutation/updateLanguage";
import { USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> updateLanguage", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateLanguageArgs = {
        languageCode: "newLanguageCode",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateLanguageResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`updates the organization with _id === args.id and returns the updated organization`, async () => {
    const args: MutationUpdateLanguageArgs = {
      languageCode: "newLanguageCode",
    };

    const context = {
      userId: testUser!._id,
    };

    const updateLanguagePayload = await updateLanguageResolver?.(
      {},
      args,
      context
    );

    const testUpdateLanguagePayload = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(updateLanguagePayload).toEqual(testUpdateLanguagePayload);
  });
});
