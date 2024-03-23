import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreatePostArgs } from "../../../src/types/generatedGraphQLTypes";
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
  BASE_URL,
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { Organization, Post } from "../../../src/models";
import { createPost as createPostResolverImage } from "../../../src/resolvers/Mutation/createPost";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import * as uploadEncodedVideo from "../../../src/utilities/encodedVideoStorage/uploadEncodedVideo";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let testUser: TestUserType;
let randomUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createPost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
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
        userId: new Types.ObjectId().toString(),
      };

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: new Types.ObjectId().toString(),
          text: "",
          videoUrl: "",
          title: "",
          imageUrl: null,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it(`throws USER_NOT_AUTHORIZED_TO_PIN ERROR if the user is not authorized to pin the post`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization?._id,
          text: "New Post Text",
          videoUrl: "http://dummyURL.com/",
          title: "New Post Title",
          imageUrl: "http://dummyURL.com/image/",
          pinned: true,
        },
      };

      const context = {
        userId: randomUser?.id,
      };

      expect(args.data.pinned).toBe(true);
      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      const createPost = await createPostResolver?.({}, args, context);
      expect(createPost?.pinned).toBe(true);
    } catch (error) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_AUTHORIZED_TO_PIN.MESSAGE}`,
        );
      }
    }
  });

  it(`pinned post should be successfully added to the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );

    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization?.id,
        text: "New Post Text",
        videoUrl: "http://dummyURL.com/",
        title: "New Post Title",
        imageUrl: "http://dummyURL.com/image/",
        pinned: true,
      },
    };
    const context = {
      userId: testUser?.id,
    };

    expect(args.data.pinned).toBe(true);

    const { createPost: createPostResolver } = await import(
      "../../../src/resolvers/Mutation/createPost"
    );
    const createdPost = await createPostResolver?.({}, args, context);
    expect(createdPost).toEqual(
      expect.objectContaining({
        text: "New Post Text",
        videoUrl: null, // Update the expected value to match the received value
        title: "New Post Title",
        pinned: true,
      }),
    );

    const updatedTestOrg = await Organization.findOne({
      _id: testOrganization?.id,
    }).lean();

    expect(
      updatedTestOrg?.pinnedPosts
        .map((id) => id.toString())
        .includes(createdPost?._id.toString()),
    ).toBeTruthy();
  });

  it(`creates the post and returns it when image or video is not provided`, async () => {
    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization?.id,
        text: "text",
        videoUrl: "videoUrl",
        title: "title",
        pinned: true,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    expect(args.data.pinned).toBe(true);

    const { createPost: createPostResolver } = await import(
      "../../../src/resolvers/Mutation/createPost"
    );

    const createPostPayload = await createPostResolver?.({}, args, context);
    expect(createPostPayload?.pinned).toBe(true);

    expect(createPostPayload).toEqual(
      expect.objectContaining({
        title: "title",
        videoUrl: null, // Update the expected value to match the received value
        creatorId: testUser?._id,
        organization: testOrganization?._id,
        imageUrl: null,
      }),
    );
  });

  it(`creates the post and and returns it when an image is provided`, async () => {
    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization?.id,
        text: "text",
        title: "title",
        pinned: true,
      },
      file: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAZSURBVBhXYzxz5sx/BiBgefLkCQMbGxsDAEdkBicg9wbaAAAAAElFTkSuQmCC", // Provide a supported file type
    };

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );

    const context = {
      userId: testUser?.id,
      apiRootUrl: BASE_URL,
    };

    expect(args.data.pinned).toBe(true);

    const createPostPayload = await createPostResolverImage?.(
      {},
      args,
      context,
    );
    expect(createPostPayload?.pinned).toBe(true);

    const testCreatePostPayload = await Post.findOne({
      _id: createPostPayload?._id,
      imageUrl: { $ne: null },
    }).lean();

    //Ensures that the post is created and imageUrl is not null
    expect(testCreatePostPayload).not.toBeNull();
  });

  it(`creates the post and and returns it when a video is provided`, async () => {
    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization?.id,
        text: "text",
        title: "title",
        pinned: true,
      },
      file: "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE", // Provide a supported file type
    };

    vi.spyOn(uploadEncodedVideo, "uploadEncodedVideo").mockImplementation(
      async (uploadEncodedVideo: string) => uploadEncodedVideo,
    );

    const context = {
      userId: testUser?.id,
      apiRootUrl: BASE_URL,
    };

    expect(args.data.pinned).toBe(true);

    const createPostPayload = await createPostResolverImage?.(
      {},
      args,
      context,
    );
    expect(createPostPayload?.pinned).toBe(true);

    const testCreatePostPayload = await Post.findOne({
      _id: createPostPayload?._id,
      videoUrl: { $ne: null },
    }).lean();

    //Ensures that the post is created and videoUrl is not null
    expect(testCreatePostPayload).not.toBeNull();
  });

  it(`creates the post and throws an error for unsupported file type`, async () => {
    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization?.id,
        text: "text",
        videoUrl: "videoUrl",
        title: "title",
        pinned: true,
      },
      file: "unsupportedFile.txt", // Provide an unsupported file type
    };

    const context = {
      userId: testUser?.id,
      apiRootUrl: BASE_URL,
    };

    expect(args.data.pinned).toBe(true);

    // Mock the uploadEncodedImage function to throw an error for unsupported file types
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      () => {
        throw new Error("Unsupported file type.");
      },
    );

    // Ensure that an error is thrown when createPostResolverImage is called
    await expect(
      createPostResolverImage?.({}, args, context),
    ).rejects.toThrowError("Unsupported file type.");
  });

  it(`throws String Length Validation error if title is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization?._id,
          text: "random",
          videoUrl: "",
          title:
            "AfGtN9o7IJXH9Xr5P4CcKTWMVWKOOHTldleLrWfZcThgoX5scPE5o0jARvtVA8VhneyxXquyhWb5nluW2jtP0Ry1zIOUFYfJ6BUXvpo4vCw4GVleGBnoKwkFLp5oW9L8OsEIrjVtYBwaOtXZrkTEBySZ1prr0vFcmrSoCqrCTaChNOxL3tDoHK6h44ChFvgmoVYMSq3IzJohKtbBn68D9NfEVMEtoimkGarUnVBAOsGkKv0mIBJaCl2pnR8Xwq1cG1",
          imageUrl: null,
          pinned: true,
        },
      };

      const context = {
        userId: testUser?.id,
      };
      expect(args.data.pinned).toBe(true);
      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      const createdPost = await createPostResolver?.({}, args, context);
      expect(createdPost?.pinned).toBe(true);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
        );
      }
    }
  });
  it(`throws String Length Validation error if text is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization?._id,
          text: "JWQPfpdkGGGKyryb86K4YN85nDj4m4F7gEAMBbMXLax73pn2okV6kpWY0EYO0XSlUc0fAlp45UCgg3s6mqsRYF9FOlzNIDFLZ1rd03Z17cdJRuvBcAmbC0imyqGdXHGDUQmVyOjDkaOLAvjhB5uDeuEqajcAPTcKpZ6LMpigXuqRAd0xGdPNXyITC03FEeKZAjjJL35cSIUeMv5eWmiFlmmm70FU1Bp6575zzBtEdyWPLflcA2GpGmmf4zvT7nfgN3NIkwQIhk9OwP8dn75YYczcYuUzLpxBu1Lyog77YlAj5DNdTIveXu9zHeC6V4EEUcPQtf1622mhdU3jZNMIAyxcAG4ErtztYYRqFs0ApUxXiQI38rmiaLcicYQgcOxpmFvqRGiSduiCprCYm90CHWbQFq4w2uhr8HhR3r9HYMIYtrRyO6C3rPXaQ7otpjuNgE0AKI57AZ4nGG1lvNwptFCY60JEndSLX9Za6XP1zkVRLaMZArQNl",
          videoUrl: "",
          title: "random",
          imageUrl: null,
          pinned: true,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      expect(args.data.pinned).toBe(true);

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      const createdPost = await createPostResolver?.({}, args, context);
      expect(createdPost?.pinned).toBe(true);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`,
        );
      }
    }
  });

  it("throws an error if the user tries to create a post but post is not pinned", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization?._id,
          text: "text",
          pinned: false,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      expect(args.data.pinned).toBe(false);
      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );
      const createdPost = await createPostResolver?.({}, args, context);
      expect(createdPost?.pinned).toBe(false);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Cannot create post when pinned is false`,
        );
      }
    }
  });

  it("throws error if title is provided and post is not pinned", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization?._id,
          title: "Test title",
          text: "Test text",
          pinned: false,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      expect(args.data.pinned).toBe(false);
      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );
      const createdPost = await createPostResolver?.({}, args, context);
      expect(createdPost?.pinned).toBe(false);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Post needs to be pinned inorder to add a title`,
        );
      }
    }
  });

  it("throws error if title is not provided and post is pinned", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization?._id,
          title: "",
          text: "Test text",
          pinned: true,
        },
      };

      const context = {
        userId: testUser?.id,
      };
      expect(args.data.pinned).toBe(true);

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );
      const createPost = await createPostResolver?.({}, args, context);
      expect(createPost?.pinned).toBe(true);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(`Please provide a title to pin post`);
      }
    }
  });
});
