import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import type { InterfaceMembershipRequest } from "../../src/models";
import {
  AppUserProfile,
  MembershipRequest,
  Organization,
  User,
} from "../../src/models";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUser, createTestUserAndOrganization } from "./userAndOrg";

export type TestMembershipRequestType =
  | (InterfaceMembershipRequest &
      Document<unknown, unknown, InterfaceMembershipRequest>)
  | null;

export const createTestMembershipRequest = async (): Promise<
  [TestUserType, TestOrganizationType, TestMembershipRequestType]
> => {
  const testUser = await createTestUser();

  if (testUser) {
    const testOrganization = await Organization.create({
      name: `name${nanoid().toLowerCase()}`,
      description: `desc${nanoid().toLowerCase()}`,
      isPublic: true,
      creatorId: testUser._id,
      admins: [testUser._id],
      visibleInSearch: true,
    });

    const testMembershipRequest = await MembershipRequest.create({
      user: testUser._id,
      organization: testOrganization._id,
    });

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $push: {
          membershipRequests: testMembershipRequest._id,
        },
      },
    );
    await AppUserProfile.updateOne(
      {
        userId: testUser._id,
      },
      {
        $push: {
          createdOrganizations: testOrganization._id,
          adminFor: testOrganization._id,
        },
      },
    );

    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $push: {
          membershipRequests: testMembershipRequest._id,
        },
      },
    );

    return [testUser, testOrganization, testMembershipRequest];
  } else {
    return [testUser, null, null];
  }
};

export const createTestMembershipRequestAsNew = async (): Promise<
  [TestUserType, TestOrganizationType, TestMembershipRequestType]
> => {
  const resultsArray = await createTestUserAndOrganization();

  let testUser = resultsArray[0];
  let testOrganization = resultsArray[1];

  if (testUser && testOrganization) {
    const testMembershipRequest = await MembershipRequest.create({
      user: testUser._id,
      organization: testOrganization._id,
    });

    testUser = await User.findOneAndUpdate(
      {
        _id: testUser._id,
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
        _id: testOrganization._id,
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
    return [testUser, testOrganization, testMembershipRequest];
  } else {
    return [testUser, testOrganization, null];
  }
};
