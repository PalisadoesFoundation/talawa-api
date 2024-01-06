import "dotenv/config";
import { org as orgResolver } from "../../../src/resolvers/Category/org";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Organization } from "../../../src/models";
import { type TestOrganizationType } from "../../helpers/userAndOrg";
import type { TestCategoryType } from "../../helpers/category";
import { createTestCategory } from "../../helpers/category";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testCategory: TestCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization, testCategory] = await createTestCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Category -> org", () => {
  it(`returns the organization object for parent category`, async () => {
    const parent = testCategory?.toObject();

    const orgPayload = await orgResolver?.(parent, {}, {});

    const orgObject = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();

    expect(orgPayload).toEqual(orgObject);
  });
});
