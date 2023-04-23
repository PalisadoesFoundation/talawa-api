import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { MutationCreatePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  LENGTH_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  BASE_URL,
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
  TestOrganizationType,
  TestUserType,
  createTestUser,
} from "../../helpers/userAndOrg";
import { Organization } from "../../../src/models";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { nanoid } from "nanoid";
import { createPost as createPostResolverImage } from "../../../src/resolvers/Mutation/createPost";

const testImagePath: string = `${nanoid().toLowerCase()}test.png`;
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
        userId: Types.ObjectId().toString(),
      };

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
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
          organizationId: Types.ObjectId().toString(),
          text: "",
          videoUrl: "",
          title: "",
          imageUrl: null,
        },
      };

      const context = {
        userId: testUser!.id,
      };

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
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
          organizationId: testOrganization!._id,
          text: "New Post Text",
          videoUrl: "http://dummyURL.com/",
          title: "New Post Title",
          imageUrl: "http://dummyURL.com/image/",
          pinned: true,
        },
      };

      const context = {
        userId: randomUser!.id,
      };

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_TO_PIN.MESSAGE}`
      );
    }
  });

  it(`pinned post should be successfully added to the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization!.id,
        text: "New Post Text",
        videoUrl: "http://dummyURL.com/",
        title: "New Post Title",
        imageUrl: "http://dummyURL.com/image/",
        pinned: true,
      },
    };
    const context = {
      userId: testUser!.id,
    };

    const { createPost: createPostResolver } = await import(
      "../../../src/resolvers/Mutation/createPost"
    );
    const createdPost = await createPostResolver?.({}, args, context);

    expect(createdPost).toEqual(
      expect.objectContaining({
        text: "New Post Text",
        videoUrl: "http://dummyURL.com/",
        title: "New Post Title",
      })
    );

    const updatedTestOrg = await Organization.findOne({
      _id: testOrganization!.id,
    }).lean();

    expect(
      updatedTestOrg!.pinnedPosts
        .map((id) => id.toString())
        .includes(createdPost!._id.toString())
    ).toBeTruthy();
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
        imageUrl: null,
      })
    );
  });

  it(`creates the post and returns it when image is provided`, async () => {
    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization!.id,
        text: "text",
        videoUrl: "videoUrl",
        title: "title",
      },
      file: testImagePath,
    };

    const context = {
      userId: testUser!.id,
      apiRootUrl: BASE_URL,
    };

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL
    );

    const createPostPayload = await createPostResolverImage?.(
      {},
      args,
      context
    );

    expect(createPostPayload).toEqual(
      expect.objectContaining({
        title: "title",
        videoUrl: "videoUrl",
        creator: testUser!._id,
        organization: testOrganization!._id,
        imageUrl: `${context.apiRootUrl}${testImagePath}`,
      })
    );
  });
  it(`throws String Length Validation error if title is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization!._id,
          text: "random",
          videoUrl: "",
          title:
            "AfGtN9o7IJXH9Xr5P4CcKTWMVWKOOHTldleLrWfZcThgoX5scPE5o0jARvtVA8VhneyxXquyhWb5nluW2jtP0Ry1zIOUFYfJ6BUXvpo4vCw4GVleGBnoKwkFLp5oW9L8OsEIrjVtYBwaOtXZrkTEBySZ1prr0vFcmrSoCqrCTaChNOxL3tDoHK6h44ChFvgmoVYMSq3IzJohKtbBn68D9NfEVMEtoimkGarUnVBAOsGkKv0mIBJaCl2pnR8Xwq1cG1",
          imageUrl: null,
        },
      };

      const context = {
        userId: testUser!.id,
      };

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`
      );
    }
  });
  it(`throws String Length Validation error if text is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization!._id,
          text: "JWQPfpdkGGGKyryb86K4YN85nDj4m4F7gEAMBbMXLax73pn2okV6kpWY0EYO0XSlUc0fAlp45UCgg3s6mqsRYF9FOlzNIDFLZ1rd03Z17cdJRuvBcAmbC0imyqGdXHGDUQmVyOjDkaOLAvjhB5uDeuEqajcAPTcKpZ6LMpigXuqRAd0xGdPNXyITC03FEeKZAjjJL35cSIUeMv5eWmiFlmmm70FU1Bp6575zzBtEdyWPLflcA2GpGmmf4zvT7nfgN3NIkwQIhk9OwP8dn75YYczcYuUzLpxBu1Lyog77YlAj5DNdTIveXu9zHeC6V4EEUcPQtf1622mhdU3jZNMIAyxcAG4ErtztYYRqFs0ApUxXiQI38rmiaLcicYQgcOxpmFvqRGiSduiCprCYm90CHWbQFq4w2uhr8HhR3r9HYMIYtrRyO6C3rPXaQ7otpjuNgE0AKI57AZ4nGG1lvNwptFCY60JEndSLX9Za6XP1zkVRLaMZArQNl",
          videoUrl: "",
          title: "random",
          imageUrl: null,
        },
      };

      const context = {
        userId: testUser!.id,
      };

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`
      );
    }
  });
});
