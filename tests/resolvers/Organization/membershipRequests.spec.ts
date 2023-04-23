import "dotenv/config";
import { membershipRequests as membershipRequestsResolver } from "../../../src/resolvers/Organization/membershipRequests";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization();
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];

  const testMembershipRequest = await MembershipRequest.create({
    user: testUser?._id,
    organization: testOrganization?._id,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
    {
      new: true,
    }
  );

  testOrganization = await Organization.findOneAndUpdate(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> membershipRequests", () => {
  it(`returns all membershipRequest objects for parent.membershipRequests`, async () => {
    const parent = testOrganization?.toObject();

    if (parent) {
      const membershipRequestsPayload = await membershipRequestsResolver?.(
        parent,
        {},
        {}
      );

      const membershipRequests = await MembershipRequest.find({
        _id: {
          $in: testOrganization?.membershipRequests,
        },
      }).lean();

      expect(membershipRequestsPayload).toEqual(membershipRequests);
    }
  });
});
