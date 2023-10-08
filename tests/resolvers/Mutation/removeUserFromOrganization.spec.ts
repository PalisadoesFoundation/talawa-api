import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization, User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../../src/constants";
import type { MutationRemoveUserFromOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestUserType } from "../../helpers/user";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUserSuperAdmin: TestUserType;
let testNonMemberAdmin: TestUserType;
let testMemberUser: TestUserType;
let testAdminUser: TestUserType;
let testBlockedMemberUser: TestUserType;
let testOrganization: TestOrganizationType;
let hashedPassword: string;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  hashedPassword = await bcrypt.hash("password", 12);
  testUserSuperAdmin = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedPassword,
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
    userType: "SUPERADMIN",
    isSuperAdmin: true,
    adminApproved: true,
  });
  testAdminUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedPassword,
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
    userType: "ADMIN",
    adminApproved: true,
  });
  testMemberUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedPassword,
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
    userType: "USER",
    adminApproved: true,
  });
  testBlockedMemberUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedPassword,
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
    userType: "USER",
    adminApproved: true,
  });
  testNonMemberAdmin = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedPassword,
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
    userType: "ADMIN",
    adminApproved: true,
  });
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUserSuperAdmin?._id,
    admins: [testUserSuperAdmin?._id, testAdminUser?._id],
    members: [testUserSuperAdmin?._id, testAdminUser?._id, testMemberUser?._id],
    blockedUsers: [testBlockedMemberUser?._id],
  });
  await User.updateOne(
    {
      _id: testUserSuperAdmin?._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization?._id],
        adminFor: [testOrganization?._id],
        joinedOrganizations: [testOrganization?._id],
      },
    }
  );
  await User.updateOne(
    {
      _id: testAdminUser?._id,
    },
    {
      $set: {
        adminFor: [testOrganization?._id],
        joinedOrganizations: [testOrganization?._id],
      },
    }
  );
  await User.updateOne(
    {
      _id: testMemberUser?._id,
    },
    {
      $set: {
        joinedOrganizations: [testOrganization?._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeUserFromOrganization", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`Check when organization does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationRemoveUserFromOrganizationArgs = {
        organizationId: Types.ObjectId().toHexString(),
        userId: testUserSuperAdmin?._id,
      };
      const context = {
        userId: testUserSuperAdmin?._id,
      };

      const { removeUserFromOrganization: removeUserFromOrganizationResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromOrganization"
        );
      await removeUserFromOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`Check when user to be removed does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationRemoveUserFromOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: Types.ObjectId().toHexString(),
      };
      const context = {
        userId: testUserSuperAdmin?._id,
      };

      const { removeUserFromOrganization: removeUserFromOrganizationResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromOrganization"
        );
      await removeUserFromOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`Check when user to be removed is not a member of the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationRemoveUserFromOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testNonMemberAdmin?._id,
      };
      const context = {
        userId: testUserSuperAdmin?._id,
      };

      const { removeUserFromOrganization: removeUserFromOrganizationResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromOrganization"
        );
      await removeUserFromOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE);
    }
  });
  it(`Check when logged in user exists or not`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationRemoveUserFromOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testMemberUser?._id,
      };
      const context = {
        userId: Types.ObjectId().toHexString(),
      };

      const { removeUserFromOrganization: removeUserFromOrganizationResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromOrganization"
        );
      await removeUserFromOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`Check when logged in SUPERADMIN user is not allowed to remove member`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationRemoveUserFromOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testMemberUser?._id,
      };
      const context = {
        userId: testNonMemberAdmin?._id,
      };

      const { removeUserFromOrganization: removeUserFromOrganizationResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromOrganization"
        );
      await removeUserFromOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });
  it(`Check when logged in ADMIN non member user is not allowed to remove member`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationRemoveUserFromOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testMemberUser?._id,
      };
      const context = {
        userId: testNonMemberAdmin?._id,
      };

      const { removeUserFromOrganization: removeUserFromOrganizationResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromOrganization"
        );
      await removeUserFromOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });

  it(`Check when logged in ADMIN non member user is not allowed to remove member`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    const args: MutationRemoveUserFromOrganizationArgs = {
      organizationId: testOrganization?._id,
      userId: testAdminUser?._id,
    };
    const context = {
      userId: testUserSuperAdmin?._id,
    };

    const { removeUserFromOrganization: removeUserFromOrganizationResolver } =
      await import(
        "../../../src/resolvers/Mutation/removeUserFromOrganization"
      );
    await removeUserFromOrganizationResolver?.({}, args, context);
    const updatedOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();
    expect(updatedOrganization?.members).not.toContain(testAdminUser?._id);
    expect(updatedOrganization?.admins).not.toContain(testAdminUser?._id);
    expect(updatedOrganization?.blockedUsers).not.toContain(testAdminUser?._id);
    const updateUser = await User.findOne({
      _id: testAdminUser?._id,
    }).lean();

    expect(updateUser?.adminFor).not.toContain(testOrganization?._id);
    expect(updateUser?.joinedOrganizations).not.toContain(
      testOrganization?._id
    );
  });
});
