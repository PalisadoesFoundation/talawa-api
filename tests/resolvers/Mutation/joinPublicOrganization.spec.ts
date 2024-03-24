import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization, User } from "../../../src/models";
import type { MutationJoinPublicOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
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
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization(true, true, true);
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> joinPublicOrganization", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError message if no organization exists with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: unknown) => message);
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it(`throws UnauthorizedError message if organization with _id === args.organizationId  required registration for the users`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: unknown) => message);
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError message if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: unknown) => message);
    try {
      const updatedOrganizaiton = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            userRegistrationRequired: false,
          },
        },
        {
          new: true,
        },
      );
      if (updatedOrganizaiton) await cacheOrganizations([updatedOrganizaiton]);

      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws ConflictError message if user with _id === context.userId is already a member of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: unknown) => message);
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_ALREADY_MEMBER_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_ALREADY_MEMBER_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if the user is blocked from the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: unknown) => message);
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?.id,
        },
        {
          $pull: {
            members: testUser?.id,
          },
          $addToSet: {
            blockedUsers: testUser?.id,
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        cacheOrganizations([updatedOrganization]);
      }

      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`returns user object with _id === context.userId after joining the organization    `, async () => {
    const updatedOrganizaiton = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $pull: {
          blockedUsers: testUser?.id,
        },
        $set: {
          members: [],
        },
      },
      {
        new: true,
      },
    );
    if (updatedOrganizaiton) await cacheOrganizations([updatedOrganizaiton]);

    const args: MutationJoinPublicOrganizationArgs = {
      organizationId: testOrganization?.id,
    };

    const context = {
      userId: testUser?.id,
    };
    const { joinPublicOrganization: joinPublicOrganizationResolver } =
      await import("../../../src/resolvers/Mutation/joinPublicOrganization");

    const joinPublicOrganizationPayload =
      await joinPublicOrganizationResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["-password"])
      .populate("joinedOrganizations")
      .lean();

    expect(joinPublicOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["members"])
      .lean();

    expect(updatedTestOrganization?.members).toEqual([testUser?._id]);
  });
});
