import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationRemoveAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { removeAdmin as removeAdminResolver } from "../../../src/resolvers/Mutation/removeAdmin";
import {
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND_MESSAGE,
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
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect();
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
        userId: testUser!.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

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
        userId: testUser!.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

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
          userId: testUser!.id,
        },
      };

      const context = {
        userId: testUser!.id,
      };

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator
  of organization with _id === args.data.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $push: {
            admins: testUser!._id,
          },
          $set: {
            creator: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization!.id,
          userId: testUser!.id,
        },
      };

      const context = {
        userId: testUser!.id,
      };

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
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
          creator: testUser!._id,
        },
      }
    );

    const args: MutationRemoveAdminArgs = {
      data: {
        organizationId: testOrganization!.id,
        userId: testUser!.id,
      },
    };

    const context = {
      userId: testUser!.id,
    };

    const removeAdminPayload = await removeAdminResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["-password"])
      .lean();

    expect(removeAdminPayload).toEqual(updatedTestUser);
  });
});
