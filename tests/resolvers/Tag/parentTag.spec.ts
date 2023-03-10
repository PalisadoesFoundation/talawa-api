import "dotenv/config";
import { parentTag as parentTagResolver } from "../../../src/resolvers/Tag/parentTag";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
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

describe("resolvers -> Tag -> parentTag", () => {
  it(`returns the parent tag object`, async () => {
    const parent = testRootTag!.toObject();
    const childTags = [testChildTag1!.toObject(), testChildTag2!.toObject()];

    const payload1 = await parentTagResolver?.(childTags[0], {}, {});
    const payload2 = await parentTagResolver?.(childTags[1], {}, {});

    expect(payload1).toEqual(parent);
    expect(payload2).toEqual(parent);
  });

  it(`returns null if the tag is a root level tag`, async () => {
    const parent = testRootTag!.toObject();

    const payload = await parentTagResolver?.(parent, {}, {});

    expect(payload).toEqual(null);
  });
});
