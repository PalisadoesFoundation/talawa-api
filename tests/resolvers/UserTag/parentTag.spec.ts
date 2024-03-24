import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OrganizationTagUser } from "../../../src/models";
import { parentTag as parentTagResolver } from "../../../src/resolvers/UserTag/parentTag";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserTagType } from "../../helpers/tags";
import { createTwoLevelTagsWithOrg } from "../../helpers/tags";

let MONGOOSE_INSTANCE: typeof mongoose;
let testChildTag: TestUserTagType, testParentTag: TestUserTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testParentTag, testChildTag]] = await createTwoLevelTagsWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Tag -> parentTag", () => {
  it(`returns the correct parentTag object`, async () => {
    const parent = testChildTag;
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const payload = await parentTagResolver?.(parent, {}, {});

    const parentTag = await OrganizationTagUser.findOne({
      _id: testParentTag?._id,
    }).lean();

    expect(payload).toEqual(parentTag);
  });

  it(`returns null if the tag is a root tag and has no parent tag i.e. tag.parentTagId === null`, async () => {
    const parent = testParentTag;
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const payload = await parentTagResolver?.(parent, {}, {});

    expect(payload).toEqual(null);
  });
});
