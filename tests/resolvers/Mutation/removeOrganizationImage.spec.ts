import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import type { MutationRemoveOrganizationImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  ORGANIZATION_IMAGE_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
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
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserFunc } from "../../helpers/user";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
/* eslint-disable */
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUserFunc();

  testAdminUser = await createTestUserFunc();

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    address: {
      countryCode: `US`,
      city: `SAMPLE`,
      dependentLocality: "TEST",
      line1: "TES",
      postalCode: "110001",
      sortingCode: "ABC-123",
      state: "Delhi",
    },
    isPublic: true,
    admins: [testAdminUser?._id],
    creatorId: testAdminUser?._id,
    members: [testUser?._id],
    blockedUsers: [testUser?._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    },
  );
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeOrganizationImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeOrganizationImage: removeOrganizationImageResolver } =
        await import("../../../src/resolvers/Mutation/removeOrganizationImage");

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId
  is not an admin of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeOrganizationImage: removeOrganizationImageResolver } =
        await import("../../../src/resolvers/Mutation/removeOrganizationImage");

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ADMIN.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no organization.image exists for organization
  with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveOrganizationImageArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testAdminUser?.id,
      };

      const { removeOrganizationImage: removeOrganizationImageResolver } =
        await import("../../../src/resolvers/Mutation/removeOrganizationImage");

      await removeOrganizationImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ORGANIZATION_IMAGE_NOT_FOUND_ERROR.MESSAGE,
      );
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_IMAGE_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it("should delete the Organizatin Image and return the updated Organization object", async () => {
    const utilities = await import("../../../src/utilities");

    const deleteImageSpy = vi
      .spyOn(utilities, "deleteImage")
      .mockImplementation(() => {
        return Promise.resolve();
      });

    const args: MutationRemoveOrganizationImageArgs = {
      organizationId: testOrganization?._id,
    };

    const testImage = "testImage";

    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          image: testImage,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const context = {
      userId: testAdminUser?._id,
    };

    const { removeOrganizationImage: removeOrganizationImageResolver } =
      await import("../../../src/resolvers/Mutation/removeOrganizationImage");

    const removeOrganizationImagePayload =
      await removeOrganizationImageResolver?.({}, args, context);

    const updatedTestOrg = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();

    expect(removeOrganizationImagePayload).toEqual(updatedTestOrg);
    expect(deleteImageSpy).toBeCalledWith(testImage);
    expect(removeOrganizationImagePayload?.image).toEqual(null);
  });
});
