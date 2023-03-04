import "dotenv/config";
import { Types } from "mongoose";
import { MutationCreatePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  USER_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  REGEX_VALIDATION_ERROR,
  LENGTH_VALIDATION_ERROR,
  MONGOOSE_POST_ERRORS,
  USER_NOT_AUTHORIZED_TO_PIN,
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
  createTestUser,
} from "../../helpers/userAndOrg";
import { Post } from "../../../src/models";
import { Organization } from "../../../src/models";

let testUser: testUserType;
let randomUser: testUserType;
let testOrganization: testOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;
const DB_POST_VALIDATION_ERROR = "Post validation failed";

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
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
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_TO_PIN.message);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_TO_PIN.message}`
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
  it(`throws Regex Validation Failed error if title contains a character other then number, letter, or symbol`, async () => {
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
          title: "🍕",
          imageUrl: null,
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
        };
      });

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `${REGEX_VALIDATION_ERROR.message} in title`
      );
    }
  });
  it(`throws Regex Validation Failed error if text contains a character other then number, letter, or symbol`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message
    );
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: testOrganization!._id,
          text: "🍕",
          videoUrl: "",
          title: "random",
          imageUrl: null,
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
        };
      });

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `${REGEX_VALIDATION_ERROR.message} in information`
      );
    }
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.message} 256 characters in title`
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { createPost: createPostResolver } = await import(
        "../../../src/resolvers/Mutation/createPost"
      );

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.message} 500 characters in information`
      );
    }
  });
});

describe("MONGODB validation errors for create Post", () => {
  it("should throw title invalid length error when title.length() > 256", async () => {
    try {
      let invalidTitle: string = "";
      for (let index = 0; index <= 256; index++) {
        invalidTitle += "a";
      }
      await Post.create({
        title: invalidTitle,
        text: `text`,
        creator: testUser!._id,
        organization: testOrganization!._id,
      });
    } catch (error: any) {
      expect(error.message).toBe(
        DB_POST_VALIDATION_ERROR +
          ": title: " +
          MONGOOSE_POST_ERRORS.TITLE_ERRORS.lengthError
      );
    }
  });

  it("should throw title invalid regex error when title does not match pattern", async () => {
    try {
      await Post.create({
        title: "<script></sciript>",
        text: `text`,
        creator: testUser!._id,
        organization: testOrganization!._id,
      });
    } catch (error: any) {
      expect(error.message).toBe(
        DB_POST_VALIDATION_ERROR +
          ": title: " +
          MONGOOSE_POST_ERRORS.TITLE_ERRORS.regexError
      );
    }
  });

  it("should throw text invalid length error when text.length() > 500", async () => {
    try {
      let invalidText: string = "";
      for (let index = 0; index <= 256; index++) {
        invalidText += "a";
      }
      await Post.create({
        title: "title",
        text: invalidText,
        creator: testUser!._id,
        organization: testOrganization!._id,
      });
    } catch (error: any) {
      expect(error.message).toBe(
        DB_POST_VALIDATION_ERROR +
          ": title: " +
          MONGOOSE_POST_ERRORS.TEXT_ERRORS.lengthError
      );
    }
  });

  it("should throw text invalid regex error when text does not match the pattern", async () => {
    try {
      await Post.create({
        title: "title",
        text: "<script></script>",
        creator: testUser!._id,
        organization: testOrganization!._id,
      });
    } catch (error: any) {
      expect(error.message).toBe(
        DB_POST_VALIDATION_ERROR +
          ": text: " +
          MONGOOSE_POST_ERRORS.TEXT_ERRORS.regexError
      );
    }
  });
});
