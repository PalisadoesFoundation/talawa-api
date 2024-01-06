import "dotenv/config";
import { category as categoryResolver } from "../../../src/resolvers/Query/category";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { CATEGORY_NOT_FOUND_ERROR } from "../../../src/constants";
import type { QueryCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestCategoryType } from "../../helpers/category";
import { createTestCategory } from "../../helpers/category";

let MONGOOSE_INSTANCE: typeof mongoose;
let testCategory: TestCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestCategory();
  testCategory = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> category", () => {
  it(`throws NotFoundError if no category exists with _id === args.id`, async () => {
    try {
      const args: QueryCategoryArgs = {
        id: Types.ObjectId().toString(),
      };

      await categoryResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(CATEGORY_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns category with _id === args.id`, async () => {
    const args: QueryCategoryArgs = {
      id: testCategory?._id,
    };

    const categoryPayload = await categoryResolver?.({}, args, {});

    expect(categoryPayload).toEqual(
      expect.objectContaining({
        _id: testCategory?._id,
      })
    );
  });
});
