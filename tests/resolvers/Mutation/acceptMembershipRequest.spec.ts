import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import type { MutationAcceptMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testMembershipRequest: TestMembershipRequestType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestMembershipRequest();
  testUser = resultArray[0];
  testOrganization = resultArray[1];
  testMembershipRequest = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> acceptMembershipRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no membershipRequest exists with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { acceptMembershipRequest: acceptMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/acceptMembershipRequest");

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no organization exists with _id === membershipRequest.organization
  for membershipRequest with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
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

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { acceptMembershipRequest: acceptMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/acceptMembershipRequest");

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === membershipRequest.user
  for membershipRequest with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
            user: new Types.ObjectId().toString(),
          },
        },
      );

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { acceptMembershipRequest: acceptMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/acceptMembershipRequest");

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an
  admin of organization with _id === membershipRequest.organization for
  membershipRequest with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            user: testUser?.id,
          },
        },
      );

      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            admins: [],
          },
        },
      );

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { acceptMembershipRequest: acceptMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/acceptMembershipRequest");

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
  });

  it(`throws ConflictError if user with _id === membershipRequest.user is already
  a member of organization with _id === membershipRequest.organization for membershipRequest
  with _id === args.membershipRequestId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            admins: testUser?._id,
            members: testUser?._id,
          },
        },
      );

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { acceptMembershipRequest: acceptMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/acceptMembershipRequest");

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_ALREADY_MEMBER_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_ALREADY_MEMBER_ERROR.MESSAGE}`,
      );
    }
  });

  it(`accepts the membershipRequest and returns it`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          members: [],
        },
      },
    );

    const args: MutationAcceptMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest?.id,
    };

    const context = {
      userId: testUser?.id,
    };
    const { acceptMembershipRequest: acceptMembershipRequestResolver } =
      await import("../../../src/resolvers/Mutation/acceptMembershipRequest");
    const acceptMembershipRequestPayload =
      await acceptMembershipRequestResolver?.({}, args, context);

    expect(acceptMembershipRequestPayload?._id).toEqual(
      testMembershipRequest?._id,
    );

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["members", "membershipRequests"])
      .lean();

    expect(updatedTestOrganization).toEqual(
      expect.objectContaining({
        members: expect.arrayContaining([testUser?._id]),
        membershipRequests: expect.arrayContaining([]),
      }),
    );

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["joinedOrganizations", "membershipRequests"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        joinedOrganizations: expect.arrayContaining([testOrganization?._id]),
        membershipRequests: expect.arrayContaining([]),
      }),
    );
  });
});
