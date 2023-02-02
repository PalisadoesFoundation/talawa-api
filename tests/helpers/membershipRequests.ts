import {
  createTestUser,
  testUserType,
  testOrganizationType,
} from "./userAndOrg";
import {
  Interface_MembershipRequest,
  MembershipRequest,
  Organization,
  User,
} from "../../src/models";
import { Document } from "mongoose";

export type testMembershipRequestType =
  | (Interface_MembershipRequest &
      Document<any, any, Interface_MembershipRequest>)
  | null;

export const createTestMembershipRequest = async (): Promise<
  [testUserType, testOrganizationType, testMembershipRequestType]
> => {
  const testUser = await createTestUser();

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser!._id,
    admins: [testUser!._id],
    visibleInSearch: true,
  });

  const testMembershipRequest = await MembershipRequest.create({
    user: testUser!._id,
    organization: testOrganization._id,
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        membershipRequests: testMembershipRequest._id,
      },
    }
  );

  await Organization.updateOne(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );

  return [testUser, testOrganization, testMembershipRequest];
};
