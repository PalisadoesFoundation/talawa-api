import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationRemoveOrganizationImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { removeOrganizationImage as removeOrganizationImageResolver } from "../../../src/resolvers/Mutation/removeOrganizationImage";
import {
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
  vi,
  afterEach,
} from "vitest";
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";
import { createTestUserFunc } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testAdminUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUserFunc();

  testAdminUser = await createTestUserFunc();

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    admins: [testAdminUser!._id],
    creator: testAdminUser!._id,
    members: [testUser!._id],
    blockedUsers: [testUser!._id],
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> removeOrganizationImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId // IN_PRODUCTION =true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: "",
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
      const { removeOrganizationImage: removeOrganizationImageResolver } =
        await import("../../../src/resolvers/Mutation/removeOrganizationImage");

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.DESC);
    }
  });
  it(`throws NotFoundError if no organization exists with _id === args.organizationId //IN_PRODUCTION = true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationImageArgs = {
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
      const { removeOrganizationImage: removeOrganizationImageResolver } =
        await import("../../../src/resolvers/Mutation/removeOrganizationImage");

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId
  is not an admin of organization with _id === args.organizationId //IN_PRODUCTION = true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeOrganizationImage: removeOrganizationImageResolver } =
        await import("../../../src/resolvers/Mutation/removeOrganizationImage");

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ADMIN.message);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.message}`
      );
    }
  });

  it(`throws NotFoundError if no organization.image exists for organization
  with _id === args.organizationId`, async () => {
    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testAdminUser!.id,
      };

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual("Organization image not found");
    }
  });

  it(`throws NotFoundError if no organization.image exists for organization
  with _id === args.organizationId // IN_PRODUCTION = true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testAdminUser!.id,
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

      const { removeOrganizationImage: removeOrganizationImageResolver } =
        await import("../../../src/resolvers/Mutation/removeOrganizationImage");

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith("organization.profile.notFound");
      expect(error.message).toEqual(
        `Translated ${"organization.profile.notFound"}`
      );
    }
  });

  it("should delete the Organizatin Image and return the updated Organization object", async () => {
    const utilities = await import("../../../src/utilities");

    const deleteImageSpy = vi
      .spyOn(utilities, "deleteImage")
      .mockImplementation((_imageToBeDeleted: string) => {
        return Promise.resolve();
      });

    const args: MutationRemoveOrganizationImageArgs = {
      organizationId: testOrganization!._id,
    };

    const testImage: string = "testImage";

    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          image: testImage,
        },
      }
    );

    const context = {
      userId: testAdminUser!._id,
    };

    const { removeOrganizationImage: removeOrganizationImageResolver } =
      await import("../../../src/resolvers/Mutation/removeOrganizationImage");

    const removeOrganizationImagePayload =
      await removeOrganizationImageResolver?.({}, args, context);

    const updatedTestOrg = await Organization.findOne({
      _id: testOrganization!._id,
    }).lean();

    expect(removeOrganizationImagePayload).toEqual(updatedTestOrg);
    expect(deleteImageSpy).toBeCalledWith(testImage);
    expect(removeOrganizationImagePayload?.image).toEqual(null);
  });
});
