import "dotenv/config";
import { Types } from "mongoose";
import { MutationCreatePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
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
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createPost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId and IN_PRODUCTION === false`, async () => {
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: "",
          text: "",
          videoUrl: "",
          title: "",
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
          IN_PRODUCTION: false,
        };
      });

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: "",
          text: "",
          videoUrl: "",
          title: "",
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

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId and IN_PRODUCTION === false`, async () => {
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          text: "",
          videoUrl: "",
          title: "",
        },
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
          IN_PRODUCTION: false,
        };
      });

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          text: "",
          videoUrl: "",
          title: "",
          imageUrl: "",
        },
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

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_MESSAGE}`
      );
    }
  });

  it(`creates the post and returns it when image is not provided`, async () => {
    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization!.id,
        text: "text",
        videoUrl: "videoUrl",
        title: "title",
      },
    };

    const context = {
      userId: testUser!.id,
    };

    const { createPost: createPostResolver } = await import(
      "../../../src/resolvers/Mutation/createPost"
    );

    const createPostPayload = await createPostResolver?.({}, args, context);

    expect(createPostPayload).toEqual(
      expect.objectContaining({
        title: "title",
        videoUrl: "videoUrl",
        creator: testUser!._id,
        organization: testOrganization!._id,
        imageUrl: "",
      })
    );
  });
  it(`creates the post and returns it when image is provided`, async () => {
    const utilities = await import("../../../src/utilities");

    const newImageFile = {
      filename: "testImage.png",
      createReadStream: {},
    };

    const returnImageFile = {
      newImagePath: "/testImage",
      imageAlreadyInDbPath: "",
    };

    const uploadImageSpy = vi
      .spyOn(utilities, "uploadImage")
      .mockImplementation(() => {
        return Promise.resolve(returnImageFile);
      });

    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization!.id,
        text: "text",
        videoUrl: "videoUrl",
        title: "title",
      },
      file: newImageFile,
    };

    const context = {
      userId: testUser!.id,
    };

    const { createPost: createPostResolver } = await import(
      "../../../src/resolvers/Mutation/createPost"
    );

    const createPostPayload = await createPostResolver?.({}, args, context);

    expect(uploadImageSpy).toBeCalledWith(newImageFile, "");
    expect(createPostPayload).toEqual(
      expect.objectContaining({
        title: "title",
        videoUrl: "videoUrl",
        creator: testUser!._id,
        organization: testOrganization!._id,
        imageUrl: returnImageFile.newImagePath,
      })
    );
  });
});
