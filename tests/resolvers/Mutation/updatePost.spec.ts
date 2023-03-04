import "dotenv/config";
import { Types } from "mongoose";
import { Post } from "../../../src/models";
import { MutationUpdatePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updatePost as updatePostResolver } from "../../../src/resolvers/Mutation/updatePost";
import {
  LENGTH_VALIDATION_ERROR,
  POST_NOT_FOUND_MESSAGE,
  REGEX_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestPost, testPostType } from "../../helpers/posts";

let testUser: testUserType;
let testPost: testPostType;

beforeEach(async () => {
  await connect();
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});
afterEach(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updatePost", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updatePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      await updatePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError as current user with _id === context.userId is
  not an creator of post with _id === args.id`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      await Post.updateOne(
        { _id: testPost!._id },
        { $set: { creator: Types.ObjectId().toString() } }
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });

  it(`updates the post with _id === args.id and returns the updated post`, async () => {
    const args: MutationUpdatePostArgs = {
      id: testPost!._id,
      data: {
        title: "newTitle",
        text: "nextText",
      },
    };

    const context = {
      userId: testUser!._id,
    };

    const updatePostPayload = await updatePostResolver?.({}, args, context);

    const testUpdatePostPayload = await Post.findOne({
      _id: testPost!._id,
    }).lean();

    expect(updatePostPayload).toEqual(testUpdatePostPayload);
  });
  it(`throws Regex Validation Failed error if title contains a character other then number, letter, or symbol`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message
    );
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost!._id,
        data: {
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

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
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
      const args: MutationUpdatePostArgs = {
        id: testPost!._id,
        data: {
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

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
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
      const args: MutationUpdatePostArgs = {
        id: testPost!._id,
        data: {
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

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
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
      const args: MutationUpdatePostArgs = {
        id: testPost!._id,
        data: {
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

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `${LENGTH_VALIDATION_ERROR.message} 500 characters in information`
      );
    }
  });
});
