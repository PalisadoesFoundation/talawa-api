import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/UserTag/organization";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createRootTagWithOrg, testUserTagType } from "../../helpers/tags";
import { testOrganizationType } from "../../helpers/userAndOrg";
import { Organization } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testTag: testUserTagType, testOrg: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrg, testTag] = await createRootTagWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Tag -> organization", () => {
  it(`returns the correct organization object`, async () => {
    const parent = testTag!.toObject();

    const payload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testOrg!._id,
    }).lean();

    expect(payload).toEqual(organization);
  });
});
