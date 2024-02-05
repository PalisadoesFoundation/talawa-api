import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/AgendaCategory/updatedBy";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { AgendaCategoryModel, User } from "../../../src/models";
import type {
  TestOrganizationType,
  createTestUser,
  TestUserType,
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
