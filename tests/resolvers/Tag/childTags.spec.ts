import "dotenv/config";
import mongoose from "mongoose";
import { childTags as childTagsResolver } from "../../../src/resolvers/Tag/childTags";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTwoLevelTagsWithOrg, testTagType } from "../../helpers/tags";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testRootTag: testTagType,
  testChildTag1: testTagType,
  testChildTag2: testTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testRootTag, testChildTag1, testChildTag2]] =
    await createTwoLevelTagsWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Tag -> childTags", () => {
  it(`returns the correct list of child tag objects`, async () => {
    const parent = testRootTag!.toObject();
    const childTags = [testChildTag1!.toObject(), testChildTag2!.toObject()];

    // @ts-ignore
    const payload = await childTagsResolver?.(parent, {}, {});

    expect(payload).toEqual(childTags);
  });

  it(`returns empty list when the tag object has no children`, async () => {
    const parent = testChildTag1!.toObject();

    // @ts-ignore
    const payload = await childTagsResolver?.(parent, {}, {});

    expect(payload).toEqual([]);
  });
});
