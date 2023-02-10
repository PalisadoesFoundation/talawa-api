import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationLeaveOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { leaveOrganization as leaveOrganizationResolver } from "../../../src/resolvers/Mutation/leaveOrganization";
import {
  MEMBER_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
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

describe("resolvers -> Mutation -> leaveOrganization", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLeaveOrganizationArgs = {
        organizationId: Types.ObjectId().toString(),
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
      const { leaveOrganization: leaveOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/leaveOrganization"
      );

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });
      const { leaveOrganization: leaveOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/leaveOrganization"
      );

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is the creator
  of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization!.id,
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
      const { leaveOrganization: leaveOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/leaveOrganization"
      );

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });

  it(`throws ConflictError if user with _id === context.userId is not a member
  of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
            members: [],
          },
        }
      );

      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization!.id,
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
      const { leaveOrganization: leaveOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/leaveOrganization"
      );

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(MEMBER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(MEMBER_NOT_FOUND_MESSAGE);
    }
  });

  it(`returns user object with _id === context.userId after leaving the organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $push: {
          members: testUser!._id,
        },
      }
    );

    const args: MutationLeaveOrganizationArgs = {
      organizationId: testOrganization!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const leaveOrganizationPayload = await leaveOrganizationResolver?.(
      {},
      args,
      context
    );

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["-password"])
      .lean();

    expect(leaveOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    })
      .select(["admins", "members"])
      .lean();

    expect(updatedTestOrganization!.admins).toEqual([]);
    expect(updatedTestOrganization!.members).toEqual([]);
  });
});
