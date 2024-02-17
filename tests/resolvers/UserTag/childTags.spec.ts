import "dotenv/config";
import { childTags as childTagsResolver } from "../../../src/resolvers/UserTag/childTags";
import type {
  UserTagsConnectionResult,
  UserTagChildTagsArgs,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserTagType } from "../../helpers/tags";
import { createTwoLevelTagsWithOrg } from "../../helpers/tags";
import { MAXIMUM_FETCH_LIMIT } from "../../../src/constants";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testChildTag1: TestUserTagType,
  testChildTag2: TestUserTagType,
  testParentTag: TestUserTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testParentTag, testChildTag1, testChildTag2]] =
    await createTwoLevelTagsWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Tag -> childTags", () => {
  it(`returns error object when the maximum fetch limit is exceeded`, async () => {
    const parent = testParentTag!;

    const args: UserTagChildTagsArgs = {
      input: {
        limit: MAXIMUM_FETCH_LIMIT + 1,
        direction: "FORWARD",
      },
    };

    const payload = await childTagsResolver?.(parent, args, {});

    expect(payload!.errors.length).toEqual(1);
    expect(payload!.errors[0]).toMatchObject({
      __typename: "MaximumValueError",
    });
    expect(payload!.data).toBeNull();
  });

  it(`returns error object when the cursor provided is incorrect`, async () => {
    const parent = testParentTag!;

    const args: UserTagChildTagsArgs = {
      input: {
        limit: MAXIMUM_FETCH_LIMIT,
        direction: "FORWARD",
        cursor: Types.ObjectId().toString(),
      },
    };

    const payload = await childTagsResolver?.(parent, args, {});

    expect(payload!.errors.length).toEqual(1);
    expect(payload!.errors[0]).toMatchObject({
      __typename: "InvalidCursor",
    });
    expect(payload!.data).toBeNull();
  });

  it(`returns correct connection object when the arguments are correct`, async () => {
    const parent = testParentTag!;

    const args: UserTagChildTagsArgs = {
      input: {
        limit: MAXIMUM_FETCH_LIMIT,
        direction: "FORWARD",
      },
    };

    const payload = (await childTagsResolver?.(
      parent,
      args,
      {}
    )) as UserTagsConnectionResult;

    expect(payload.errors.length).toEqual(0);
    expect(payload.data).not.toBeNull();
    expect(payload.data!.pageInfo.startCursor).toEqual(
      testChildTag1!._id.toString()
    );
    expect(payload.data!.pageInfo.endCursor).toEqual(
      testChildTag2!._id.toString()
    );
    expect(payload.data!.edges[0].node).toEqual(testChildTag1);
  });
});
