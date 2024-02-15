import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { createdBy as createdByResolver } from "../../../src/resolvers/AgendaCategory/createdBy";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { User } from "../../../src/models";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";
import { createTestAgendaCategory } from "../../helpers/agendaCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testAdminUser: TestUserType;
let testAgendaCategory: TestAgendaCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testAdminUser, , testAgendaCategory] = await createTestAgendaCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> AgendaCategory -> createdBy", () => {
  it(`returns the creator for parent agendaCategory`, async () => {
    const parent = testAgendaCategory?.toObject();

    const createdByPayload = await createdByResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testAdminUser?._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
