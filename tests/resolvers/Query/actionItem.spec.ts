import "dotenv/config";
import { actionItem as actionItemResolver } from "../../../src/resolvers/Query/actionItem";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { ACTION_ITEM_NOT_FOUND_ERROR } from "../../../src/constants";
import type { QueryActionItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let testActionItem: TestActionItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestActionItem();
  testActionItem = resultArray[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItem", () => {
  it(`throws NotFoundError if no actionItem exists with _id === args.id`, async () => {
    try {
      const args: QueryActionItemArgs = {
        id: Types.ObjectId().toString(),
      };

      await actionItemResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(ACTION_ITEM_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns action item with _id === args.id`, async () => {
    const args: QueryActionItemArgs = {
      id: testActionItem?._id,
    };

    const actionItemPayload = await actionItemResolver?.({}, args, {});

    expect(actionItemPayload).toEqual(
      expect.objectContaining({
        _id: testActionItem?._id,
      })
    );
  });
});
