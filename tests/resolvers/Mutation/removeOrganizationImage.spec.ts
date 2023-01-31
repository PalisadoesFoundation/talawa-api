import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationRemoveOrganizationImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { removeOrganizationImage as removeOrganizationImageResolver } from "../../../src/resolvers/Mutation/removeOrganizationImage";
import {
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testAdminUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testAdminUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    admins: [testAdminUser._id],
    creator: testAdminUser._id,
    members: [testUser._id],
    blockedUsers: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
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
  await disconnect();
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
      expect(error.message).toEqual(USER_NOT_FOUND);
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
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
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
        userId: testUser.id,
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
      expect(spy).toHaveBeenLastCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_MESSAGE}`
      );
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId
  is not an admin of organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
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
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
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
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no organization.image exists for organization
  with _id === args.organizationId`, async () => {
    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testAdminUser.id,
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
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testAdminUser.id,
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
      organizationId: testOrganization._id,
    };

    const testImage: string = "testImage";

    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          image: testImage,
        },
      }
    );

    const context = {
      userId: testAdminUser._id,
    };

    const { removeOrganizationImage: removeOrganizationImageResolver } =
      await import("../../../src/resolvers/Mutation/removeOrganizationImage");

    const removeOrganizationImagePayload =
      await removeOrganizationImageResolver?.({}, args, context);

    const updatedTestOrg = await Organization.findOne({
      _id: testOrganization._id,
    }).lean();

    expect(removeOrganizationImagePayload).toEqual(updatedTestOrg);
    expect(deleteImageSpy).toBeCalledWith(testImage);
    expect(removeOrganizationImagePayload?.image).toEqual(null);
  });
});
