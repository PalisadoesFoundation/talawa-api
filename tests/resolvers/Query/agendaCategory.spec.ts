import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AGENDA_CATEGORY_NOT_FOUND_ERROR } from "../../../src/constants";
import { AgendaCategoryModel, Organization } from "../../../src/models";
import { agendaCategory } from "../../../src/resolvers/Query/agendaCategory";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";
import { connect, disconnect } from "../../helpers/db";
import {
  createTestUser,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testAgendaCategory: TestAgendaCategoryType;
let MONGOOSE_INSTANCE: typeof mongoose;

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
  testAgendaCategory = await AgendaCategoryModel.create({
    name: "Test Categ",
    description: "Test Desc",
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

describe("resolvers -> Query -> agendaCategory", () => {
  it("returns the agenda category successfully when it exists", async () => {
    try {
      const args = {
        id: testAgendaCategory?._id,
      };
      const result = await agendaCategory?.({}, args, {});
      expect(result).toBeDefined();
      expect(result?._id).toStrictEqual(testAgendaCategory?._id);
    } catch (error) {
      // Handle any unexpected errors during the test
      console.error("Test failed with error:", error);
      throw error;
    }
  });

  it("throws a NotFoundError when the agenda category does not exist", async () => {
    try {
      const args = {
        id: Types.ObjectId().toString(),
      };
      await agendaCategory?.({}, args, {});
      // If the resolver does not throw an error, the test fails
      throw new Error("Test failed. Expected NotFoundError but got no error.");
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
});
