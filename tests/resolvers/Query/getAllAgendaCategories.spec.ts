import { Organization, AgendaCategoryModel } from "../../../src/models";
import { USER_NOT_AUTHORIZED_ERROR } from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import type { MutationCreateAgendaCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  Test,
  vi,
  test,
} from "vitest";
import type { TestEventType } from "../../helpers/events";
import { agendaCategories } from "../../../src/resolvers/Query/getAllAgendaCategories";
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAgendaCategory: any;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser2: TestUserType;
let testAgendaCategory2: any;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
  });

  testAgendaCategory = await AgendaCategoryModel.create({
    name: "Test Categ",
    description: "Test Desc",
    organization: testOrganization?._id,
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  testAgendaCategory2 = await AgendaCategoryModel.create({
    name: "Test Categ2",
    description: "Test Desc2",
    organization: testOrganization?._id,
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers -> Query -> getAllAgendaCategories", () => {
  it("resolvers -> Query -> getAllAgendaItems: returns all agenda category successfully", async () => {
    const result = await agendaCategories?.({}, {}, {});
    expect(result).toBeDefined();
  });

  it("resolvers -> Query -> getAllAgendaCategories: handles different input scenarios", async () => {
    // Test with specific arguments
    const result1 = await agendaCategories?.({ someKey: "someValue" }, {}, {});
    expect(result1).toBeDefined();

    // Test with empty arguments
    const result2 = await agendaCategories?.({}, {}, {});
    expect(result2).toBeDefined();
  });
});
