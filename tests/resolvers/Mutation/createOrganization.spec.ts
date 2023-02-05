import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationCreateOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createOrganization as createOrganizationResolver } from "../../../src/resolvers/Mutation/createOrganization";
import { USER_NOT_FOUND, USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import { nanoid } from "nanoid";
import * as uploadImage from "../../../src/utilities/uploadImage";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

const testImagePath: string = `${nanoid().toLowerCase()}test.png`;
let testUser: testUserType;

vi.mock("../../utilities", () => ({
  uploadImage: vi.fn(),
}));

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createOrganization", () => {
  afterEach(async () => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const args: MutationCreateOrganizationArgs = {
      data: {
        description: "description",
        isPublic: true,
        name: "name",
        visibleInSearch: true,
        apiUrl: "apiUrl",
        location: "location",
        tags: ["tag"],
      },
    };

    const context = {
      userId: Types.ObjectId().toString(),
    };

    const { createOrganization } = await import(
      "../../../src/resolvers/Mutation/createOrganization"
    );
    expect(async () => {
      await createOrganization?.({}, args, context);
    }).rejects.toThrowError(USER_NOT_FOUND);
  });
  it(`throws NotFoundError if no user exists with _id === context.userId and IN_PRODUCTION is true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateOrganizationArgs = {
        data: {
          description: "description",
          isPublic: true,
          name: "name",
          visibleInSearch: true,
          apiUrl: "apiUrl",
          location: "location",
          tags: ["tag"],
        },
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
      const { createOrganization } = await import(
        "../../../src/resolvers/Mutation/createOrganization"
      );
      await createOrganization?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`creates the organization with image and returns it`, async () => {
    vi.spyOn(uploadImage, "uploadImage").mockImplementationOnce(
      async (newImagePath: any, imageAlreadyInDbPath: any) => ({
        newImagePath,
        imageAlreadyInDbPath,
      })
    );
    const args: MutationCreateOrganizationArgs = {
      data: {
        description: "description",
        isPublic: true,
        name: "name",
        visibleInSearch: true,
        apiUrl: "apiUrl",
        location: "location",
        tags: ["tag"],
      },
      file: testImagePath,
    };
    const context = {
      userId: testUser!._id,
    };

    const createOrganizationPayload = await createOrganizationResolver?.(
      {},
      args,
      context
    );
    expect(createOrganizationPayload).toEqual(
      expect.objectContaining({
        description: "description",
        isPublic: true,
        name: "name",
        visibleInSearch: true,
        apiUrl: "apiUrl",
        location: "location",
        creator: testUser!._id,
        admins: [testUser!._id],
        members: [testUser!._id],
        image: testImagePath,
      })
    );
    expect(createOrganizationPayload?.image).toEqual(testImagePath);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["joinedOrganizations", "createdOrganizations", "adminFor"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        joinedOrganizations: [createOrganizationPayload!._id],
        createdOrganizations: [createOrganizationPayload!._id],
        adminFor: [createOrganizationPayload!._id],
      })
    );
  });
  it(`creates the organization without image and returns it`, async () => {
    vi.spyOn(uploadImage, "uploadImage").mockImplementationOnce(
      async (newImagePath: any, imageAlreadyInDbPath: any) => ({
        newImagePath,
        imageAlreadyInDbPath,
      })
    );
    const args: MutationCreateOrganizationArgs = {
      data: {
        description: "description",
        isPublic: true,
        name: "name",
        visibleInSearch: true,
        apiUrl: "apiUrl",
        location: "location",
        tags: ["tag"],
      },
      file: null,
    };
    const context = {
      userId: testUser!._id,
    };

    const createOrganizationPayload = await createOrganizationResolver?.(
      {},
      args,
      context
    );
    expect(createOrganizationPayload).toEqual(
      expect.objectContaining({
        description: "description",
        isPublic: true,
        name: "name",
        visibleInSearch: true,
        apiUrl: "apiUrl",
        location: "location",
        creator: testUser!._id,
        admins: [testUser!._id],
        members: [testUser!._id],
      })
    );
    expect(createOrganizationPayload?.image).toBe(null);
  });
});
