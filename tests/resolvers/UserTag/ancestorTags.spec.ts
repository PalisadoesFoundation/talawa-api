import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceOrganizationTagUser } from "../../../src/models";
import { OrganizationTagUser } from "../../../src/models";
import { ancestorTags as ancestorTagsResolver } from "../../../src/resolvers/UserTag/ancestorTags";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserTagType } from "../../helpers/tags";
import { createTwoLevelTagsWithOrg } from "../../helpers/tags";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testRootTag: TestUserTagType,
  testSubTagLevel1: TestUserTagType,
  testSubTagLevel2: TestUserTagType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization, [testRootTag, testSubTagLevel1]] =
    await createTwoLevelTagsWithOrg();

  testSubTagLevel2 = await OrganizationTagUser.create({
    name: "testSubTagLevel2",
    parentTagId: testSubTagLevel1?._id,
    organizationId: testOrganization?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Tag -> ancestorTags", () => {
  it(`returns an empty ancestorTags array for the root tag`, async () => {
    const parent = testRootTag as InterfaceOrganizationTagUser;

    const payload = await ancestorTagsResolver?.(parent, {}, {});

    expect(payload).toEqual([]);
  });

  it(`returns the correct ancestorTags array for a nested tag`, async () => {
    const parent = testSubTagLevel2 as InterfaceOrganizationTagUser;

    const payload = await ancestorTagsResolver?.(parent, {}, {});

    expect(payload).toEqual([testRootTag, testSubTagLevel1]);
  });
});
