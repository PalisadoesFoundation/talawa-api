import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/AgendaCategory/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Organization } from "../../../src/models";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testAgendaCategory: TestAgendaCategoryType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
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
