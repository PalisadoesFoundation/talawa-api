import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { getUserTagAncestors as getUserTagAncestorsResolver } from "../../../src/resolvers/Query/getUserTagAncestors";
import type { QueryGetUserTagAncestorsArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  createTwoLevelTagsWithOrg,
  type TestUserTagType,
} from "../../helpers/tags";
import { TAG_NOT_FOUND } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;

let testTag: TestUserTagType;
let testSubTag1: TestUserTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testTag, testSubTag1]] = await createTwoLevelTagsWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getUserTagAncestors", () => {
  it(`throws NotFoundError if no userTag exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: QueryGetUserTagAncestorsArgs = {
        id: new Types.ObjectId().toString(),
      };

      await getUserTagAncestorsResolver?.({}, args, {});
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${TAG_NOT_FOUND.MESSAGE}`,
      );
    }
  });

  it(`returns the list of all the ancestor tags for a tag with _id === args.id`, async () => {
    const args: QueryGetUserTagAncestorsArgs = {
      id: testSubTag1?._id.toString() ?? "",
    };

    const getUserTagAncestorsPayload = await getUserTagAncestorsResolver?.(
      {},
      args,
      {},
    );

    expect(getUserTagAncestorsPayload).toEqual([testTag, testSubTag1]);
  });
});
