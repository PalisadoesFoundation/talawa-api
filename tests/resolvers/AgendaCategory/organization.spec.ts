import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/AgendaCategory/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { AgendaCategoryModel, Organization } from "../../../src/models";
import type {
  TestUserType,
  createTestUser,
  TestOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";
import { createTestAgendaCategory } from "../../helpers/agendaCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testAgendaCategory: TestAgendaCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testAdminUser, testOrganization, testAgendaCategory] =
    await createTestAgendaCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> AgendaCategory -> org", () => {
  it(`returns the organization object for parent agendaCategory`, async () => {
    const parent = testAgendaCategory?.toObject();

    const orgPayload = await organizationResolver?.(parent, {}, {});

    const orgObject = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();

    expect(orgPayload).toEqual(orgObject);
  });
});
