import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import type { MutationRejectMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { rejectMembershipRequest as rejectMembershipRequestResolver } from "../../../src/resolvers/Mutation/rejectMembershipRequest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
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
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testMembershipRequest: TestMembershipRequestType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestMembershipRequest();
  testUser = temp[0];
  testOrganization = temp[1];
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> rejectMembershipRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no membershipRequest exists with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { rejectMembershipRequest: rejectMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/rejectMembershipRequest");

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no organization exists with _id === membershipRequest.organzation
  for membershipRequest with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            organization: new Types.ObjectId().toString(),
          },
        },
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { rejectMembershipRequest: rejectMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/rejectMembershipRequest");

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === membershipRequest.user
  for membershipRequest with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
          },
        },
      );

      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            user: new Types.ObjectId().toString(),
          },
        },
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { rejectMembershipRequest: rejectMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/rejectMembershipRequest");

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organzation with _id === membershipRequest.organzation for membershipRequest 
  with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      await MembershipRequest.findByIdAndUpdate(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            user: testUser?._id,
          },
        },
      );

      await Organization.findByIdAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?._id.toString() ?? "",
      };

      const context = {
        userId: testUser?._id,
      };

      const {
        rejectMembershipRequest: rejectMembershipRequestResolverAdminError,
      } = await import(
        "../../../src/resolvers/Mutation/rejectMembershipRequest"
      );

      await rejectMembershipRequestResolverAdminError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
  });

  it(`deletes membershipRequest with _id === args.membershipRequestId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          admins: testUser?._id,
        },
      },
    );

    const args: MutationRejectMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const rejectMembershipRequestPayload =
      await rejectMembershipRequestResolver?.({}, args, context);

    expect(rejectMembershipRequestPayload?._id).toEqual(
      testMembershipRequest?._id,
    );

    const testUpdatedUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["membershipRequests"])
      .lean();
    expect(testUpdatedUser?.membershipRequests).toEqual([]);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["membershipRequests"])
      .lean();

    expect(testUpdatedOrganization?.membershipRequests).toEqual([]);
  });
});
