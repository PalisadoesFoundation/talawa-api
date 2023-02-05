import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationJoinPublicOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import {
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  vi,
  expect,
  afterEach,
} from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const temp = await createTestUserAndOrganization(true, true, false);
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> joinPublicOrganization", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };
      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError message if no organization exists with _id === args.organizationId when [IN_PRODUCTION === TRUE]`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationJoinPublicOrganizationArgs = {
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
          IN_PRODUCTION: true,
        };
      });

      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError if organization with _id === args.organizationId is not public`, async () => {
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };
      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError message if organization with _id === args.organizationId is not public when [IN_PRODUCTION === TRUE]`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationJoinPublicOrganizationArgs = {
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
          IN_PRODUCTION: true,
        };
      });
      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            isPublic: true,
          },
        }
      );

      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError message if no user exists with _id === context.userId  when [IN_PRODUCTION === TRUE]`, async () => {
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
            isPublic: true,
          },
        }
      );

      const args: MutationJoinPublicOrganizationArgs = {
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
          IN_PRODUCTION: true,
        };
      });

      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws ConflictError if user with _id === context.userId is already a member
  of organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };
      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_ALREADY_MEMBER);
    }
  });

  it(`throws ConflictError message if user with _id === context.userId is already a member of organization with _id === args.organizationId when [IN_PRODUCTION === TRUE]`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationJoinPublicOrganizationArgs = {
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
          IN_PRODUCTION: true,
        };
      });
      const { joinPublicOrganization: joinPublicOrganizationResolver } =
        await import("../../../src/resolvers/Mutation/joinPublicOrganization");

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_ALREADY_MEMBER_MESSAGE);
      expect(error.message).toEqual(USER_ALREADY_MEMBER_MESSAGE);
    }
  });

  it(`returns user object with _id === context.userId after joining the organization    `, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          members: [],
        },
      }
    );

    const args: MutationJoinPublicOrganizationArgs = {
      organizationId: testOrganization!.id,
    };

    const context = {
      userId: testUser!.id,
    };
    const { joinPublicOrganization: joinPublicOrganizationResolver } =
      await import("../../../src/resolvers/Mutation/joinPublicOrganization");

    const joinPublicOrganizationPayload =
      await joinPublicOrganizationResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["-password"])
      .lean();

    expect(joinPublicOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    })
      .select(["members"])
      .lean();

    expect(updatedTestOrganization!.members).toEqual([testUser!._id]);
  });
});
