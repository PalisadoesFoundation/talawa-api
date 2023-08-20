import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import type { MutationRemoveAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { removeAdmin as removeAdminResolver } from "../../../src/resolvers/Mutation/removeAdmin";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_ORGANIZATION_ADMIN,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";

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
          organizationId: Types.ObjectId().toString(),
          userId: "",
        },
      };

      const context = {
        userId: testUserRemover?.id,
      };

      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
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
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUserRemover?.id,
      };

      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
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
        }
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
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_ORGANIZATION_ADMIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_ORGANIZATION_ADMIN.MESSAGE}`
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
            creator: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        }
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
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`
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
          creator: testUserRemover?._id,
        },
      }
    );

    await User.updateOne(
      {
        _id: testUserRemover?.id,
      },
      {
        $set: {
          adminApproved: true,
          userType: "SUPERADMIN",
        },
      }
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

    const updatedTestUser = await User.findOne({
      _id: testUserRemoved?._id,
    })
      .select(["-password"])
      .lean();

    expect(removeAdminPayload).toEqual(updatedTestUser);
  });
});
