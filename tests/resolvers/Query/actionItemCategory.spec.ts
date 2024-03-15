import "dotenv/config";
import { actionItemCategory as actionItemCategoryResolver } from "../../../src/resolvers/Query/actionItemCategory";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR } from "../../../src/constants";
import type { QueryActionItemCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testCategory: TestActionItemCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestCategory();
  testCategory = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemCategory", () => {
  it(`throws NotFoundError if no actionItemCategory exists with _id === args.id`, async () => {
    try {
      const args: QueryActionItemCategoryArgs = {
        id: new Types.ObjectId().toString(),
      };

      await actionItemCategoryResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.DESC,
      );
    }
  });

  it(`returns actionItemCategory with _id === args.id`, async () => {
    const args: QueryActionItemCategoryArgs = {
      id: testCategory?._id,
    };

    const actionItemCategoryPayload = await actionItemCategoryResolver?.(
      {},
      args,
      {},
    );

    expect(actionItemCategoryPayload).toEqual(
      expect.objectContaining({
        _id: testCategory?._id,
      }),
    );
  });
});
