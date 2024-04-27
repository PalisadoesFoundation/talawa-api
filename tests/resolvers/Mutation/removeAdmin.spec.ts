import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, Organization, User } from "../../../src/models";
import type { MutationRemoveAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

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
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_ORGANIZATION_ADMIN,
} from "../../../src/constants";
import { removeAdmin as removeAdminResolver } from "../../../src/resolvers/Mutation/removeAdmin";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUserRemoved: TestUserType;
let testUserRemover: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUserRemoved = temp[0];
  testUserRemover = await createTestUser();
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeAdmin", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: new Types.ObjectId().toString(),
          userId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: "",
      };

      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throws NotFoundError if no user exists with _id === args.data.userId", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUserRemover?.id,
      };

      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUserRemover?.id,
      };

      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`throws user not authorized error if user does not have appUseProfile`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: newUser._id.toString(),
        },
      };
      const context = {
        userId: testUserRemover?.id,
      };
      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );
      await removeAdminResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it(`throws user not authorized error if current user does not have appUseProfile`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUserRemoved?.id,
        },
      };
      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });
      const context = {
        userId: newUser?.id,
      };
      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );
      await removeAdminResolver?.({}, args, context);
    } catch (error: unknown) {
      // console.log(error);
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it("throws error if no user found", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: new Types.ObjectId().toString(),
        },
      };
      const context = {
        userId: testUserRemover?.id,
      };
      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );
      await removeAdminResolver?.({}, args, context);
    } catch (error: unknown) {
      console.log(error);
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.data.userId is not an admin
  of organzation with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUserRemoved?.id,
        },
      };

      const context = {
        userId: testUserRemover?.id,
      };

      const { removeAdmin: removeAdminAdminError } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminAdminError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_ORGANIZATION_ADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_ORGANIZATION_ADMIN.MESSAGE}`,
      );
    }
  });

  it(`throws Current user must be a super admin error if user with _id === args.data.userId is not a SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            admins: testUserRemoved?._id,
          },
          $set: {
            creatorId: new Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUserRemoved?.id,
        },
      };

      const context = {
        userId: testUserRemover?.id,
      };

      const { removeAdmin: removeAdminAdminError } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminAdminError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`removes user with _id === args.data.userId from admins list of the organization
  with _id === args.data.organizationId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: testUserRemover?._id,
        },
      },
    );

    await AppUserProfile.updateOne(
      {
        userId: testUserRemover?.id,
      },
      {
        $set: {
          isSuperAdmin: true,
        },
      },
    );

    const args: MutationRemoveAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUserRemoved?.id,
      },
    };

    const context = {
      userId: testUserRemover?.id,
    };

    const removeAdminPayload = await removeAdminResolver?.({}, args, context);

    const updatedTestUser = await AppUserProfile.findOne({
      userId: testUserRemoved?._id,
    }).lean();

    expect(removeAdminPayload).toEqual(updatedTestUser);
  });
  it("throws error if user does not exists", async () => {
    const context = {
      userId: new Types.ObjectId().toString(),
    };

    const args: MutationRemoveAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUserRemover?.id,
      },
    };
    try {
      await removeAdminResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
