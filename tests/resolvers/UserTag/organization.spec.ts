import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/UserTag/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserTagType } from "../../helpers/tags";
import { createRootTagWithOrg } from "../../helpers/tags";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { Organization } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testTag: TestUserTagType, testOrg: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrg, testTag] = await createRootTagWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Tag -> organization", () => {
  it(`returns the organization object for organization with _id === tag.organizationId`, async () => {
    const parent = testTag;
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const payload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testOrg?._id,
    }).lean();

    expect(payload).toEqual(organization);
  });
});
