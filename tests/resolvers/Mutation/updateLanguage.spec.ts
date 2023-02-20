import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationUpdateLanguageArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
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
  testUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
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
