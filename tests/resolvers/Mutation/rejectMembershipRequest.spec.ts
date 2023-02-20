import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { MutationRejectMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { rejectMembershipRequest as rejectMembershipRequestResolver } from "../../../src/resolvers/Mutation/rejectMembershipRequest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_ADMIN,
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
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";
import {
  createTestMembershipRequest,
  testMembershipRequestType,
} from "../../helpers/membershipRequests";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testMembershipRequest: testMembershipRequestType;

beforeAll(async () => {
  await connect();
  const temp = await createTestMembershipRequest();
  testUser = temp[0];
  testOrganization = temp[1];
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect();
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
        membershipRequestId: Types.ObjectId().toString(),
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

      const { rejectMembershipRequest: rejectMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/rejectMembershipRequest");

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE);
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
          _id: testMembershipRequest!._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest!.id,
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

      const { rejectMembershipRequest: rejectMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/rejectMembershipRequest");

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
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
          _id: testMembershipRequest!._id,
        },
        {
          $set: {
            organization: testOrganization!._id,
          },
        }
      );

      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest!._id,
        },
        {
          $set: {
            user: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest!.id,
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

      const { rejectMembershipRequest: rejectMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/rejectMembershipRequest");

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
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
          _id: testMembershipRequest!._id,
        },
        {
          $set: {
            user: testUser!._id,
          },
        }
      );

      await Organization.findByIdAndUpdate(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      await User.findByIdAndUpdate(
        {
          _id: testUser!._id,
        },
        {
          $set: {
            userType: "USER",
          },
        }
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?._id,
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
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ADMIN.message);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.message}`
      );
    }
  });

  it(`deletes membershipRequest with _id === args.membershipRequestId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $push: {
          admins: testUser!._id,
        },
      }
    );

    const args: MutationRejectMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const rejectMembershipRequestPayload =
      await rejectMembershipRequestResolver?.({}, args, context);

    expect(rejectMembershipRequestPayload).toEqual(
      testMembershipRequest!.toObject()
    );

    const testUpdatedUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["membershipRequests"])
      .lean();

    expect(testUpdatedUser?.membershipRequests).toEqual([]);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    })
      .select(["membershipRequests"])
      .lean();

    expect(testUpdatedOrganization?.membershipRequests).toEqual([]);
  });
});
