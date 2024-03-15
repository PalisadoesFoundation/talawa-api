import "dotenv/config";
import { Types } from "mongoose";
import { Post } from "../../../src/models";
import type { MutationUpdatePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updatePost as updatePostResolver } from "../../../src/resolvers/Mutation/updatePost";
import {
  LENGTH_VALIDATION_ERROR,
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost, createTestSinglePost } from "../../helpers/posts";

let testUser: TestUserType;
let testPost: TestPostType;
let testOrganization: TestOrganizationType;
let testPost2: TestPostType;

beforeEach(async () => {
  await connect();
  const temp = await createTestPost(true);
  testUser = temp[0];
  testOrganization = temp[1];
  testPost = temp[2];
  testPost2 = await createTestSinglePost(testUser?.id, testOrganization?.id);

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});
afterEach(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updatePost", () => {
  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      await updatePostResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(POST_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError as current user with _id === context.userId is
  not an creator of post with _id === args.id`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost?._id.toString() ?? "",
      };

      const context = {
        userId: testUser?._id,
      };

      await Post.updateOne(
        { _id: testPost?._id },
        { $set: { creatorId: new Types.ObjectId().toString() } },
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`updates the post with _id === args.id and returns the updated post`, async () => {
    const args: MutationUpdatePostArgs = {
      id: testPost?._id.toString() || "",
      data: {
        title: "newTitle",
        text: "nextText",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updatePostPayload = await updatePostResolver?.({}, args, context);

    const testUpdatePostPayload = await Post.findOne({
      _id: testPost?._id,
    }).lean();

    expect(updatePostPayload).toEqual(testUpdatePostPayload);
  });
  it(`updates the post with imageUrl and returns the updated post`, async () => {
    const args: MutationUpdatePostArgs = {
      id: testPost?._id.toString() || "",
      data: {
        title: "newTitle",
        text: "nextText",
        imageUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAZSURBVBhXYzxz5sx/BiBgefLkCQMbGxsDAEdkBicg9wbaAAAAAElFTkSuQmCC",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updatePostPayload = await updatePostResolver?.({}, args, context);

    const testUpdatePostPayload = await Post.findOne({
      _id: testPost?._id,
    }).lean();

    expect(updatePostPayload).toEqual(testUpdatePostPayload);
  });
  it(`updates the post with videoUrl and returns the updated post`, async () => {
    const args: MutationUpdatePostArgs = {
      id: testPost?._id.toString() || "",
      data: {
        title: "newTitle",
        text: "nextText",
        videoUrl: "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updatePostPayload = await updatePostResolver?.({}, args, context);

    const testUpdatePostPayload = await Post.findOne({
      _id: testPost?._id,
    }).lean();

    expect(updatePostPayload).toEqual(testUpdatePostPayload);
  });
  it(`throws String Length Validation error if title is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost?._id.toString() || "",
        data: {
          text: "random",
          videoUrl: "",
          title:
            "AfGtN9o7IJXH9Xr5P4CcKTWMVWKOOHTldleLrWfZcThgoX5scPE5o0jARvtVA8VhneyxXquyhWb5nluW2jtP0Ry1zIOUFYfJ6BUXvpo4vCw4GVleGBnoKwkFLp5oW9L8OsEIrjVtYBwaOtXZrkTEBySZ1prr0vFcmrSoCqrCTaChNOxL3tDoHK6h44ChFvgmoVYMSq3IzJohKtbBn68D9NfEVMEtoimkGarUnVBAOsGkKv0mIBJaCl2pnR8Xwq1cG1",
          imageUrl: null,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
      );
    }
  });
  it(`throws String Length Validation error if text is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost?._id.toString() || "",
        data: {
          text: "JWQPfpdkGGGKyryb86K4YN85nDj4m4F7gEAMBbMXLax73pn2okV6kpWY0EYO0XSlUc0fAlp45UCgg3s6mqsRYF9FOlzNIDFLZ1rd03Z17cdJRuvBcAmbC0imyqGdXHGDUQmVyOjDkaOLAvjhB5uDeuEqajcAPTcKpZ6LMpigXuqRAd0xGdPNXyITC03FEeKZAjjJL35cSIUeMv5eWmiFlmmm70FU1Bp6575zzBtEdyWPLflcA2GpGmmf4zvT7nfgN3NIkwQIhk9OwP8dn75YYczcYuUzLpxBu1Lyog77YlAj5DNdTIveXu9zHeC6V4EEUcPQtf1622mhdU3jZNMIAyxcAG4ErtztYYRqFs0ApUxXiQI38rmiaLcicYQgcOxpmFvqRGiSduiCprCYm90CHWbQFq4w2uhr8HhR3r9HYMIYtrRyO6C3rPXaQ7otpjuNgE0AKI57AZ4nGG1lvNwptFCY60JEndSLX9Za6XP1zkVRLaMZArQNl",
          videoUrl: "",
          title: "random",
          imageUrl: null,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`,
      );
    }
  });

  it("throws error if title is provided and post is not pinned", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost2?._id.toString() || "",
        data: {
          title: "Test title",
          text: "Test text",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Post needs to be pinned inorder to add a title`,
      );
    }
  });

  it(`throws error if title is not provided and post is pinned`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost?._id.toString() || "",
        data: {
          text: "Testing text",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updatePost: updatePostResolver } = await import(
        "../../../src/resolvers/Mutation/updatePost"
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Please provide a title to pin post`,
      );
    }
  });
});
