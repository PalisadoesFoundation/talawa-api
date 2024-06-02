import "dotenv/config";
import _ from "lodash";
import { membershipRequests as membershipRequestsResolver } from "../../../src/resolvers/Organization/membershipRequests";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

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
    },
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
    },
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
        {},
      );

      const membershipRequests = await MembershipRequest.find({
        _id: {
          $in: testOrganization?.membershipRequests,
        },
      })
        .populate({
          path: "user",
        })
        .lean();
      expect(_.isEqual(membershipRequestsPayload, membershipRequests)).toBe(
        true,
      );
    }
  });

  it(`filters all membershipRequest by firstName_contains`, async () => {
    const parent = testOrganization?.toObject();
    const firstName = testUser?.firstName?.toLowerCase();

    if (parent) {
      const membershipRequestsPayload = await membershipRequestsResolver?.(
        parent,
        { where: { user: { firstName_contains: firstName } } },
        {},
      );

      const membershipRequests = await MembershipRequest.find({
        _id: {
          $in: testOrganization?.membershipRequests,
        },
      })
        .populate({
          path: "user",
        })
        .lean();

      const filteredMembershipRequests = membershipRequests.filter(
        (membershipRequest) => {
          const user = membershipRequest.user;
          const filterFirstName = firstName?.toLowerCase();

          return user && user.firstName.toLowerCase().includes(filterFirstName);
        },
      );

      expect(
        _.isEqual(membershipRequestsPayload, filteredMembershipRequests),
      ).toBe(true);
    }
  });
});
