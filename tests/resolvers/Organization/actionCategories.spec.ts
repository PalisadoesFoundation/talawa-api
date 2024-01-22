import "dotenv/config";
import { actionCategories as actionCategoriesResolver } from "../../../src/resolvers/Organization/actionCategories";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { ActionItemCategory } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestCategories } from "../../helpers/actionItemCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization] = await createTestCategories();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> actionCategories", () => {
  it(`returns all actionCategories for parent organization`, async () => {
    const parent = testOrganization?.toObject();
    if (parent) {
      const actionCategoriesPayload = await actionCategoriesResolver?.(
        parent,
        {},
        {}
      );

      const categories = await ActionItemCategory.find({
        organizationId: testOrganization?._id,
      }).lean();

      expect(actionCategoriesPayload).toEqual(categories);
    }
  });
});
