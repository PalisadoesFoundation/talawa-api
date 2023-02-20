import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/MembershipRequest/organization";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testMembershipRequestType,
  createTestMembershipRequest,
} from "../../helpers/membershipRequests";
import { Organization } from "../../../src/models";

let testMembershipRequest: testMembershipRequestType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const temp = await createTestMembershipRequest();
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
