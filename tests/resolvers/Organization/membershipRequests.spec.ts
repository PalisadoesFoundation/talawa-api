import "dotenv/config";
import { membershipRequests as membershipRequestsResolver } from "../../../src/resolvers/Organization/membershipRequests";
import { connect, disconnect } from "../../../src/db";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const userAndOrg = await createTestUserAndOrganization();
  testUser = userAndOrg[0];
  testOrganization = userAndOrg[1];

  const testMembershipRequest = await MembershipRequest.create({
    user: testUser!._id,
    organization: testOrganization!._id,
  });

  await User.updateOne(
    {
      _id: testUser!._id,
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
      _id: testOrganization!._id,
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
  await disconnect();
});

describe("resolvers -> Organization -> membershipRequests", () => {
  it(`returns all membershipRequest objects for parent.membershipRequests`, async () => {
    const parent = testOrganization!.toObject();

    const membershipRequestsPayload = await membershipRequestsResolver?.(
      parent,
      {},
      {}
    );

    const membershipRequests = await MembershipRequest.find({
      _id: {
        $in: testOrganization!.membershipRequests,
      },
    }).lean();

    expect(membershipRequestsPayload).toEqual(membershipRequests);
  });
});
