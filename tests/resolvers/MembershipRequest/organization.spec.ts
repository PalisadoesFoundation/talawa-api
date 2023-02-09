import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/MembershipRequest/organization";
import { connect, disconnect } from "../../../src/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testMembershipRequestType,
  createTestMembershipRequest,
} from "../../helpers/membershipRequests";
import { Organization } from "../../../src/models";

let testMembershipRequest: testMembershipRequestType;

beforeAll(async () => {
  await connect();
  const temp = await createTestMembershipRequest();
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect();
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
