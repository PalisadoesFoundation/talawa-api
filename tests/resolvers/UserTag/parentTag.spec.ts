import "dotenv/config";
import { parentTag as parentTagResolver } from "../../../src/resolvers/UserTag/parentTag";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTwoLevelTagsWithOrg, TestUserTagType } from "../../helpers/tags";
import { OrganizationTagUser } from "../../../src/models";

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
    const parent = testChildTag!;

    const payload = await parentTagResolver?.(parent, {}, {});

    const parentTag = await OrganizationTagUser.findOne({
      _id: testParentTag!._id,
    }).lean();

    expect(payload).toEqual(parentTag);
  });

  it(`returns null if the tag is a root tag and has no parent tag i.e. tag.parentTagId === null`, async () => {
    const parent = testParentTag!;

    const payload = await parentTagResolver?.(parent, {}, {});

    expect(payload).toEqual(null);
  });
});
