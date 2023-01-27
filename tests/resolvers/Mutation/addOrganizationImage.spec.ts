import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationAddOrganizationImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { addOrganizationImage as addOrganizationImageResolver } from "../../../src/resolvers/Mutation/addOrganizationImage";
import * as uploadImage from "../../../src/utilities/uploadImage";
import {
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
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

const testImagePath: string = `${nanoid().toLowerCase()}test.png`;
let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

vi.mock("../../utilities", () => ({
  uploadImage: vi.fn(),
}));

beforeAll(async () => {
  await connect();

  testUser = await User.create({
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
    creator: testUser._id,
    members: [testUser._id],
    admins: [testUser._id],
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
  await disconnect();
});

describe("resolvers -> Mutation -> addOrganizationImage", () => {
  afterEach(async () => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const args: MutationAddOrganizationImageArgs = {
      organizationId: "",
      file: "",
    };
    const context = {
      userId: Types.ObjectId().toString(),
    };
    const { addOrganizationImage } = await import(
      "../../../src/resolvers/Mutation/addOrganizationImage"
    );
    expect(async () => {
      await addOrganizationImage?.({}, args, context);
    }).rejects.toThrowError(USER_NOT_FOUND);
  });
  it("throws NotFoundError if no user exists with _id === context.userId and IN_PRODUCTION is true", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddOrganizationImageArgs = {
        organizationId: "",
        file: "",
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
      const { addOrganizationImage } = await import(
        "../../../src/resolvers/Mutation/addOrganizationImage"
      );
      await addOrganizationImage?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    const args: MutationAddOrganizationImageArgs = {
      organizationId: Types.ObjectId().toString(),
      file: "",
    };
    const context = {
      userId: testUser.id,
    };
    const { addOrganizationImage } = await import(
      "../../../src/resolvers/Mutation/addOrganizationImage"
    );
    expect(async () => {
      await addOrganizationImage?.({}, args, context);
    }).rejects.toThrowError(ORGANIZATION_NOT_FOUND);
  });
  it(`throws NotFoundError if no organization exists with _id === args.organizationId and IN_PRODUCTION is true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddOrganizationImageArgs = {
        organizationId: Types.ObjectId().toString(),
        file: "",
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
      const { addOrganizationImage } = await import(
        "../../../src/resolvers/Mutation/addOrganizationImage"
      );
      await addOrganizationImage?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });
  it(`updates organization's image with the old image and returns the updated organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          image: testImagePath,
        },
      }
    );
    vi.spyOn(uploadImage, "uploadImage").mockImplementationOnce(
      async (newImagePath: any, imageAlreadyInDbPath: any) => ({
        newImagePath,
        imageAlreadyInDbPath,
      })
    );
    const args: MutationAddOrganizationImageArgs = {
      organizationId: testOrganization.id,
      file: testImagePath,
    };
    const context = {
      userId: testUser._id,
    };
    const addOrganizationImagePayload = await addOrganizationImageResolver?.(
      {},
      args,
      context
    );
    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization._id,
    }).lean();
    expect(addOrganizationImagePayload).toEqual(updatedTestOrganization);
    expect(addOrganizationImagePayload?.image).toEqual(testImagePath);
  });
  it(`updates organization's image with the new image and returns the updated organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $unset: {
          image: 1,
        },
      }
    );
    vi.spyOn(uploadImage, "uploadImage").mockImplementationOnce(
      async (newImagePath: any, imageAlreadyInDbPath: any) => ({
        newImagePath,
        imageAlreadyInDbPath,
      })
    );
    const args: MutationAddOrganizationImageArgs = {
      organizationId: testOrganization.id,
      file: testImagePath,
    };
    const context = {
      userId: testUser._id,
    };
    const addOrganizationImagePayload = await addOrganizationImageResolver?.(
      {},
      args,
      context
    );
    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization._id,
    }).lean();
    expect(addOrganizationImagePayload).toEqual(updatedTestOrganization);
    expect(addOrganizationImagePayload?.image).toEqual(testImagePath);
  });
});
