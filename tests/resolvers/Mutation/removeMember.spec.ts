import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization, User } from "../../../src/models";
import type { MutationRemoveMemberArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

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
  ADMIN_REMOVING_ADMIN,
  ADMIN_REMOVING_CREATOR,
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
  USER_REMOVING_SELF,
} from "../../../src/constants";
import { createTestUserFunc } from "../../helpers/user";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: TestUserType[];
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const tempUser1 = await createTestUserFunc();
  const tempUser2 = await createTestUserFunc();
  const tempUser3 = await createTestUserFunc();
  const tempUser4 = await createTestUserFunc();
  const tempUser5 = await createTestUserFunc();
  testUsers = [tempUser1, tempUser2, tempUser3, tempUser4, tempUser5];
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: testUsers[0]?._id,
    admins: [testUsers[4]?._id, testUsers[1]?._id],
    members: [
      testUsers[0]?._id,
      testUsers[1]?._id,
      testUsers[2]?._id,
      testUsers[4],
    ],
    visibleInSearch: true,
  });

  // testUser[3] is not a member of the testOrganization
  await User.updateOne(
    {
      _id: testUsers[0]?._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    },
  );

  await User.updateOne(
    {
      _id: testUsers[1]?._id,
    },
    {
      $push: {
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    },
  );

  await User.updateOne(
    {
      _id: testUsers[2]?._id,
    },
    {
      $push: {
        joinedOrganizations: testOrganization._id,
      },
    },
  );

  await User.updateOne(
    {
      _id: testUsers[4]?._id,
    },
    {
      $push: {
        $push: {
          adminFor: testOrganization._id,
          joinedOrganizations: testOrganization._id,
        },
      },
    },
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeMember", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it(`throws user NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveMemberArgs = {
        data: {
          organizationId: new Types.ObjectId().toString(),
          userId: "",
        },
      };

      const context = {
        userId: testUsers[0]?.id,
      };

      const { removeMember: removeMemberResolverOrgNotFoundError } =
        await import("../../../src/resolvers/Mutation/removeMember");

      await removeMemberResolverOrgNotFoundError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of the organization with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[2]?.id,
      };

      const { removeMember: removeMemberResolverAdminError } = await import(
        "../../../src/resolvers/Mutation/removeMember"
      );

      await removeMemberResolverAdminError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
  });

  it("should throw user not found error when user with _id === args.data.userId does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[1]?.id,
      };

      const { removeMember: removeMemberResolverNotFoundError } = await import(
        "../../../src/resolvers/Mutation/removeMember"
      );

      await removeMemberResolverNotFoundError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it("should throw member not found error when user with _id === args.data.userId does not exist in the organization", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUsers[3]?._id,
        },
      };

      const context = {
        userId: testUsers[1]?.id,
      };

      const { removeMember: removeMemberResolverMemberNotFoundError } =
        await import("../../../src/resolvers/Mutation/removeMember");

      await removeMemberResolverMemberNotFoundError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(MEMBER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${MEMBER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it("should throw admin cannot remove self error when user with _id === args.data.userId === context.userId", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUsers[1]?._id,
        },
      };

      const context = {
        userId: testUsers[1]?.id,
      };

      const { removeMember: removeMemberResolverRemoveSelfError } =
        await import("../../../src/resolvers/Mutation/removeMember");

      await removeMemberResolverRemoveSelfError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_REMOVING_SELF.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_REMOVING_SELF.MESSAGE}`,
      );
    }
  });

  it("should throw admin cannot remove another admin error when user with _id === args.data.userId is also an admin in the organization", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUsers[4]?._id,
        },
      };

      const context = {
        userId: testUsers[1]?.id,
      };

      const { removeMember: removeMemberResolverRemoveAdminError } =
        await import("../../../src/resolvers/Mutation/removeMember");

      await removeMemberResolverRemoveAdminError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(ADMIN_REMOVING_ADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${ADMIN_REMOVING_ADMIN.MESSAGE}`,
      );
    }
  });

  it("should throw admin cannot remove creator error when user with _id === args.data.userId is the organization creator in the organization", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUsers[0]?._id,
        },
      };

      const context = {
        userId: testUsers[1]?.id,
      };

      const { removeMember: removeMemberResolverRemoveAdminError } =
        await import("../../../src/resolvers/Mutation/removeMember");

      await removeMemberResolverRemoveAdminError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(ADMIN_REMOVING_CREATOR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${ADMIN_REMOVING_CREATOR.MESSAGE}`,
      );
    }
  });

  it("remove that user with _id === args.data.userId from that organization", async () => {
    const args: MutationRemoveMemberArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUsers[2]?._id,
      },
    };

    const context = {
      userId: testUsers[1]?.id,
    };

    const { removeMember: removeMemberResolverRemoveAdminError } = await import(
      "../../../src/resolvers/Mutation/removeMember"
    );

    const updatedOrganization = await removeMemberResolverRemoveAdminError?.(
      {},
      args,
      context,
    );

    const removedUser = await User.findOne({
      _id: testUsers[2]?.id,
    });

    expect(updatedOrganization?.members).not.toContain(testUsers[2]?._id);
    expect(removedUser?.joinedOrganizations).not.toContain(
      testOrganization?._id,
    );
  });
});
