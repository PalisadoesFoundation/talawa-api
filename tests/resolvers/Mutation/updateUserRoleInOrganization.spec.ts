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
  ADMIN_CANNOT_CHANGE_ITS_ROLE,
  ADMIN_CHANGING_ROLE_OF_CREATOR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../../src/constants";
import type { MutationUpdateUserRoleInOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
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
    creatorId: testUserSuperAdmin?._id,
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

describe("resolvers -> Mutation -> updateUserRoleInOrganization", () => {
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
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: Types.ObjectId().toHexString(),
        userId: testUserSuperAdmin?._id,
        role: "ADMIN",
      };
      const context = {
        userId: testUserSuperAdmin?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`Check when user whose role to be changed does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: Types.ObjectId().toHexString(),
        role: "ADMIN",
      };
      const context = {
        userId: testUserSuperAdmin?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`Check when user whose role to be changed is not a member of the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testNonMemberAdmin?._id,
        role: "USER",
      };
      const context = {
        userId: testUserSuperAdmin?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE);
    }
  });
  it(`Check when logged in user does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testMemberUser?._id,
        role: "ADMIN",
      };
      const context = {
        userId: Types.ObjectId().toHexString(),
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`Check when USER is trying to change role of an admin`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testAdminUser?._id,
        role: "USER",
      };
      const context = {
        userId: testMemberUser?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });
  it(`Check when ADMIN of another org is not allowed to change role`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testMemberUser?._id,
        role: "ADMIN",
      };
      const context = {
        userId: testNonMemberAdmin?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });
  it(`Check when logged in ADMIN member user is not allowed to change the user type to SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testMemberUser?._id,
        role: "SUPERADMIN",
      };
      const context = {
        userId: testAdminUser?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });
  it(`Check when logged in ADMIN member user is trying to change the role of the itself`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testAdminUser?._id,
        role: "USER",
      };
      const context = {
        userId: testAdminUser?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ADMIN_CANNOT_CHANGE_ITS_ROLE.MESSAGE);
    }
  });
  it(`Check when logged in ADMIN member user is trying to change the role of the org creator`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationUpdateUserRoleInOrganizationArgs = {
        organizationId: testOrganization?._id,
        userId: testUserSuperAdmin?._id,
        role: "USER",
      };
      const context = {
        userId: testAdminUser?._id,
      };

      const {
        updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
      } = await import(
        "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
      );
      await updateUserRoleInOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ADMIN_CHANGING_ROLE_OF_CREATOR.MESSAGE);
    }
  });
  it(`Check when SUPERUSER is changing the role of a USER member to ADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    const args: MutationUpdateUserRoleInOrganizationArgs = {
      organizationId: testOrganization?._id,
      userId: testMemberUser?._id,
      role: "ADMIN",
    };
    const context = {
      userId: testUserSuperAdmin?._id,
    };

    const {
      updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
    } = await import(
      "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
    );
    await updateUserRoleInOrganizationResolver?.({}, args, context);
    const updatedOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();
    const updatedUser = await User.findOne({
      _id: testMemberUser?._id,
    }).lean();

    const updatedOrganizationCheck = updatedOrganization?.admins.some(
      (member) => member.equals(testMemberUser?._id)
    );
    const updatedUserCheck = updatedUser?.adminFor.some((organization) =>
      organization.equals(testOrganization?._id)
    );
    expect(updatedOrganizationCheck).toBe(true);
    expect(updatedUserCheck).toBe(true);
  });
  it(`Check when SUPERUSER is changing the role of a ADMIN member to USER`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    const args: MutationUpdateUserRoleInOrganizationArgs = {
      organizationId: testOrganization?._id,
      userId: testAdminUser?._id,
      role: "USER",
    };
    const context = {
      userId: testUserSuperAdmin?._id,
    };

    const {
      updateUserRoleInOrganization: updateUserRoleInOrganizationResolver,
    } = await import(
      "../../../src/resolvers/Mutation/updateUserRoleInOrganization"
    );
    await updateUserRoleInOrganizationResolver?.({}, args, context);
    const updatedOrg = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();
    const updatedUser = await User.findOne({
      _id: testAdminUser?._id,
    }).lean();

    const updatedOrgCheck = updatedOrg?.admins.some((member) =>
      member.equals(testAdminUser?._id)
    );
    const updatedUserCheck = updatedUser?.adminFor.some((organization) =>
      organization.equals(testOrganization?._id)
    );

    expect(updatedOrgCheck).toBe(false);
    expect(updatedUserCheck).toBe(false);
  });
});
