import "dotenv/config";
import { parentTag as parentTagResolver } from "../../../src/resolvers/UserTag/parentTag";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTwoLevelTagsWithOrg, testUserTagType } from "../../helpers/tags";
import { OrganizationTagUser } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testChildTag: testUserTagType, testParentTag: testUserTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testParentTag, testChildTag]] = await createTwoLevelTagsWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Tag -> parentTag", () => {
  it(`returns the correct parentTag object`, async () => {
    const parent = testChildTag!.toObject();

    const payload = await parentTagResolver?.(parent, {}, {});

    const parentTag = await OrganizationTagUser.findOne({
      _id: testParentTag!._id,
    }).lean();

    expect(payload).toEqual(parentTag);
  });

  it(`returns null as parentTag for root objects`, async () => {
    const parent = testParentTag!.toObject();

    const payload = await parentTagResolver?.(parent, {}, {});

    expect(payload).toEqual(null);
  });
});
