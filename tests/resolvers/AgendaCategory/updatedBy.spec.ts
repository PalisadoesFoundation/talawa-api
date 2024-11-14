import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/AgendaCategory/updatedBy";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { AgendaCategoryModel, Organization, User } from "../../../src/models";
import {
  createTestUser,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";

let MONGOOSE_INSTANCE: typeof mongoose;

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testAgendaCategory: TestAgendaCategoryType;

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

describe("resolvers -> AgendaCategory -> updatedBy", () => {
  it(`returns the updater for parent agendaCategory`, async () => {
    const parent = testAgendaCategory?.toObject();

    const updatedByPayload = await updatedByResolver?.(parent, {}, {});

    const updatedByObject = await User.findOne({
      _id: testAdminUser?._id,
    }).lean();

    expect(updatedByPayload).toEqual(updatedByObject);
  });
});
