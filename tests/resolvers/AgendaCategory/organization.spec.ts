import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/AgendaCategory/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { AgendaCategoryModel, Organization } from "../../../src/models";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";
import { TestUserType, createTestUser } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testAgendaCategory: TestAgendaCategoryType;
let testAdminUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testAdminUser?._id,
    admins: [testAdminUser?._id],
    members: [ testAdminUser?._id],
    creatorId: testAdminUser?._id,
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

describe("resolvers -> AgendaCategory -> organization", () => {
  it(`returns the organization object for parent agendaCategory`, async () => {
    const parent = testAgendaCategory?.toObject();

    const orgPayload = await organizationResolver?.(parent, {}, {});

    const orgObject = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();

    expect(orgPayload).toEqual(orgObject);
  });
});
