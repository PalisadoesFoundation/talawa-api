import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationUpdateLanguageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  vi,
  expect,
} from "vitest";
import {
  createTestUserAndOrganization,
  TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateLanguage", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateLanguageArgs = {
        languageCode: "newLanguageCode",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateLanguage: updateLanguageResolver } = await import(
        "../../../src/resolvers/Mutation/updateLanguage"
      );

      await updateLanguageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`updates the organization with _id === args.id and returns the updated organization`, async () => {
    const args: MutationUpdateLanguageArgs = {
      languageCode: "newLanguageCode",
    };

    const context = {
      userId: testUser!._id,
    };

    const { updateLanguage: updateLanguageResolver } = await import(
      "../../../src/resolvers/Mutation/updateLanguage"
    );

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
