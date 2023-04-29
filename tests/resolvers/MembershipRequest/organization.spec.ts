import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/MembershipRequest/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";
import { Organization } from "../../../src/models";

let testMembershipRequest: TestMembershipRequestType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestMembershipRequest();
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> MembershipRequest -> organization", () => {
  it(`returns organization object for parent.organization`, async () => {
    const parent = testMembershipRequest!.toObject();

    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testMembershipRequest!.organization,
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });
});
