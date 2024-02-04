import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/ActionItemCategory/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Organization } from "../../../src/models";
import { type TestOrganizationType } from "../../helpers/userAndOrg";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testCategory: TestActionItemCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization, testCategory] = await createTestCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItemCategory -> org", () => {
  it(`returns the organization object for parent actionItemCategory`, async () => {
    const parent = testCategory?.toObject();

    const orgPayload = await organizationResolver?.(parent, {}, {});

    const orgObject = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();

    expect(orgPayload).toEqual(orgObject);
  });
});
