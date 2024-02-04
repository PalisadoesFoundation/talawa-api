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
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";
import { createTestAgendaCategories } from "../../helpers/agendaCategory";
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAgendaCategory: TestAgendaCategoryType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser2: TestUserType;
let testAgendaCategory2: TestAgendaCategoryType;

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
    creatorId: testUser?._id,
  });

  const [testAgendaCategory, testAgendaCategory2] =
    await createTestAgendaCategories();
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
