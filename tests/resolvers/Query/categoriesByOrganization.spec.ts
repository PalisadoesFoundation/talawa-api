import "dotenv/config";
import { Category } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryCategoriesByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { categoriesByOrganization as categoriesByOrganizationResolver } from "../../../src/resolvers/Query/categoriesByOrganization";
import { createTestCategories } from "../../helpers/category";
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

describe("resolvers -> Query -> categoriesByOrganization", () => {
  it(`returns list of all categories belonging to an organization`, async () => {
    const args: QueryCategoriesByOrganizationArgs = {
      orgId: testOrganization?._id,
    };

    const categoriesByOrganizationPayload =
      await categoriesByOrganizationResolver?.({}, args, {});

    const categoriesByOrganizationInfo = await Category.find({
      orgId: testOrganization?._id,
    }).lean();

    expect(categoriesByOrganizationPayload).toEqual(
      categoriesByOrganizationInfo
    );
  });
});
