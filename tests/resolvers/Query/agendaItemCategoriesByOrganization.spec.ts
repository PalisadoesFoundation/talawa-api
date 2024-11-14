import "dotenv/config";
import { AgendaCategoryModel } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryAgendaItemCategoriesByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { agendaItemCategoriesByOrganization } from "../../../src/resolvers/Query/agendaItemCategoriesByOrganization";
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

describe("resolvers -> Query -> agendaItemCategoriesByOrganization", () => {
  it(`returns list of all categories belonging to an organization`, async () => {
    const args: QueryAgendaItemCategoriesByOrganizationArgs = {
      organizationId: testOrganization?._id,
    };

    const categoriesByOrganizationPayload =
      await agendaItemCategoriesByOrganization?.({}, args, {});

    const categoriesByOrganizationInfo = await AgendaCategoryModel.find({
      organizationId: testOrganization?._id,
    }).lean();

    expect(categoriesByOrganizationPayload).toEqual(
      categoriesByOrganizationInfo,
    );
  });
});
