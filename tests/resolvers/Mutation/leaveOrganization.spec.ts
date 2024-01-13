import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import type {
  MutationLeaveOrganizationArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { leaveOrganization as leaveOrganizationResolver } from "../../../src/resolvers/Mutation/leaveOrganization";
import {
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_FOUND_ERROR,
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
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";

import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
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
        userId: testUser?.id,
      };

      const { leaveOrganization: leaveOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/leaveOrganization"
      );

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { leaveOrganization: leaveOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/leaveOrganization"
      );

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws ConflictError if user with _id === context.userId is not a member
  of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            creatorId: Types.ObjectId().toString(),
            members: [Types.ObjectId().toString()],
          },
        },
        {
          new: true,
        }
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { leaveOrganization: leaveOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/leaveOrganization"
      );

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(MEMBER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(MEMBER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`returns user object with _id === context.userId after leaving the organization`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          members: [testUser?._id],
        },
      },
      {
        new: true,
      }
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const args: MutationLeaveOrganizationArgs = {
      organizationId: testOrganization?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const leaveOrganizationPayload = await leaveOrganizationResolver?.(
      {},
      args,
      context
    );

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["-password"])
      .lean();

    expect(leaveOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["admins", "members"])
      .lean();

    expect(updatedTestOrganization?.admins).toEqual([]);
    expect(updatedTestOrganization?.members).toEqual([]);

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "User",
    });

    expect((mostRecentTransactions as TransactionLog[])[1]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "Organization",
    });
  });
});
