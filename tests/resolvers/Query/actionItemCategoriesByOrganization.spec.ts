import "dotenv/config";
import { ActionItemCategory } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryActionItemCategoriesByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { actionItemCategoriesByOrganization as categoriesByOrganizationResolver } from "../../../src/resolvers/Query/actionItemCategoriesByOrganization";
import { createTestCategories } from "../../helpers/actionItemCategory";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import type mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization] = await createTestCategories();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemCategoriesByOrganization", () => {
  it(`returns list of all categories belonging to an organization`, async () => {
    const args: QueryActionItemCategoriesByOrganizationArgs = {
      organizationId: testOrganization?._id,
    };

    const categoriesByOrganizationPayload =
      await categoriesByOrganizationResolver?.({}, args, {});

    const categoriesByOrganizationInfo = await ActionItemCategory.find({
      organizationId: testOrganization?._id,
    }).lean();

    expect(categoriesByOrganizationPayload).toEqual(
      categoriesByOrganizationInfo,
    );
  });
});
