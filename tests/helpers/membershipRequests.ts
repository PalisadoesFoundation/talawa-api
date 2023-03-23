import {
  createTestUser,
  TestUserType,
  TestOrganizationType,
  createTestUserAndOrganization,
} from "./userAndOrg";
import {
  Interface_MembershipRequest,
  MembershipRequest,
  Organization,
  User,
} from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestMembershipRequestType =
  | (Interface_MembershipRequest &
      Document<any, any, Interface_MembershipRequest>)
  | null;

export const createTestMembershipRequest = async (): Promise<
  [TestUserType, TestOrganizationType, TestMembershipRequestType]
> => {
  const testUser = await createTestUser();

  const testOrganization = await Organization.create({
    name: `name${nanoid().toLowerCase()}`,
    description: `desc${nanoid().toLowerCase()}`,
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

export const createTestMembershipRequestAsNew = async (): Promise<
  [TestUserType, TestOrganizationType, TestMembershipRequestType]
> => {
  const resultsArray = await createTestUserAndOrganization();

  let testUser = resultsArray[0];
  let testOrganization = resultsArray[1];

  const testMembershipRequest = await MembershipRequest.create({
    user: testUser!._id,
    organization: testOrganization!._id,
  });

  testUser = await User.findOneAndUpdate(
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
  return [testUser, testOrganization, testMembershipRequest];
};
