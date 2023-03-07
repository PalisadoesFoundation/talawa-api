import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationRemoveAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { removeAdmin as removeAdminResolver } from "../../../src/resolvers/Mutation/removeAdmin";
import {
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
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
import {
  createTestUser,
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUserRemoved: testUserType;
let testUserRemover: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUserRemoved = temp[0];
  testUserRemover = await createTestUser();
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
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
        userId: testUserRemover!.id,
      };

      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
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
          organizationId: testOrganization!.id,
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUserRemover!.id,
      };

      const { removeAdmin: removeAdminResolver } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.data.userId is not an admin
  of organzation with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization!.id,
          userId: testUserRemoved!.id,
        },
      };

      const context = {
        userId: testUserRemover!.id,
      };

      const { removeAdmin: removeAdminAdminError } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminAdminError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ADMIN.message);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.message}`
      );
    }
  });

  it(`throws Current user must be a super admin error if user with _id === args.data.userId is not a SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $push: {
            admins: testUserRemoved!._id,
          },
          $set: {
            creator: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization!.id,
          userId: testUserRemoved!.id,
        },
      };

      const context = {
        userId: testUserRemover!.id,
      };

      const { removeAdmin: removeAdminAdminError } = await import(
        "../../../src/resolvers/Mutation/removeAdmin"
      );

      await removeAdminAdminError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_AUTHORIZED_SUPERADMIN.message
      );
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.message}`
      );
    }
  });


  it(`removes user with _id === args.data.userId from admins list of the organization
  with _id === args.data.organizationId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          creator: testUserRemover!._id,
        },
      }
    );

    const args: MutationRemoveAdminArgs = {
      data: {
        organizationId: testOrganization!.id,
        userId: testUserRemoved!.id,
      },
    };

    const context = {
      userId: testUserRemover!.id,
    };

    const removeAdminPayload = await removeAdminResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUserRemoved!._id,
    })
      .select(["-password"])
      .lean();

    expect(removeAdminPayload).toEqual(updatedTestUser);
  });
});
