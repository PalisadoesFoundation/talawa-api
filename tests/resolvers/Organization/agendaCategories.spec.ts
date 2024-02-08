import "dotenv/config";
import { agendaCategories as agendaCategoriesResolver } from "../../../src/resolvers/Organization/agendaCategories";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { AgendaCategoryModel, Organization } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testUser: TestUserType;
let testAdminUser: TestUserType;
// let testAgendaCategory: TestAgendaCategoryType;
// let testAgendaCategory2: TestAgendaCategoryType;

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
  //   testAgendaCategory = await AgendaCategoryModel.create({
  //     name: "Test Categ",
  //     description: "Test Desc",
  //     organization: testOrganization?._id,
  //     createdBy: testAdminUser?._id,
  //     updatedBy: testAdminUser?._id,
  //     createdAt: Date.now(),
  //     updatedAt: Date.now(),
  //   });
  //   testAgendaCategory2 = await AgendaCategoryModel.create({
  //     name: "Test Categ2",
  //     description: "Test Desc2",
  //     organization: testOrganization?._id,
  //     createdBy: testAdminUser?._id,
  //     updatedBy: testAdminUser?._id,
  //     createdAt: Date.now(),
  //     updatedAt: Date.now(),
  //   });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> agendaCategories", () => {
  it(`returns all agendaCategories for parent organization`, async () => {
    const parent = testOrganization?.toObject();
    if (parent) {
      const agendaCategoriesPayload = await agendaCategoriesResolver?.(
        parent,
        {},
        {},
      );

      const categories = await AgendaCategoryModel.find({
        organizationId: testOrganization?._id,
      }).lean();

      expect(agendaCategoriesPayload).toEqual(categories);
    }
  });
});
