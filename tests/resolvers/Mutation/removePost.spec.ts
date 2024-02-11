import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationRemovePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { Post } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPost: TestPostType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removePost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationRemovePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removePost: removePostResolver } = await import(
        "../../../src/resolvers/Mutation/removePost"
      );

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationRemovePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { removePost: removePostResolver } = await import(
        "../../../src/resolvers/Mutation/removePost"
      );

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${POST_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws UnauthorizedError if a non-creator / non-superadmin / non-admin of the org tries to delete the post`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationRemovePostArgs = {
        id: testPost?.id,
      };

      const context = {
        userId: randomUser?.id,
      };

      const { removePost: removePostResolver } = await import(
        "../../../src/resolvers/Mutation/removePost"
      );

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`deletes the post with no image and video with _id === args.id and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    const args: MutationRemovePostArgs = {
      id: testPost?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const { removePost: removePostResolver } = await import(
      "../../../src/resolvers/Mutation/removePost"
    );

    const removePostPayload = await removePostResolver?.({}, args, context);
    expect(removePostPayload).toEqual(testPost?.toObject());
  });

  it(`deletes the post with image with _id === args.id and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );
    const deletePreviousImage = await import(
      "../../../src/utilities/encodedImageStorage/deletePreviousImage"
    );
    const deleteImageSpy = vi
      .spyOn(deletePreviousImage, "deletePreviousImage")
      .mockImplementation(() => {
        return Promise.resolve();
      });

    const [newTestUser, , newTestPost] = await createTestPost();

    const updatedPost = await Post.findOneAndUpdate(
      { _id: newTestPost?.id },
      {
        $set: {
          imageUrl: "images/fakeImagePathimage.png",
        },
      },
      { new: true }
    ).lean();

    const args: MutationRemovePostArgs = {
      id: newTestPost?.id,
    };

    const context = {
      userId: newTestUser?.id,
    };

    const { removePost: removePostResolver } = await import(
      "../../../src/resolvers/Mutation/removePost"
    );

    const removePostPayload = await removePostResolver?.({}, args, context);
    expect(removePostPayload).toEqual(updatedPost);
    expect(deleteImageSpy).toBeCalledWith("images/fakeImagePathimage.png");
  });

  it(`deletes the post with video with _id === args.id and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );
    const deletePreviousVideo = await import(
      "../../../src/utilities/encodedVideoStorage/deletePreviousVideo"
    );
    const deleteVideoSpy = vi
      .spyOn(deletePreviousVideo, "deletePreviousVideo")
      .mockImplementation(() => {
        return Promise.resolve();
      });

    const [newTestUser, , newTestPost] = await createTestPost();

    const updatedPost = await Post.findOneAndUpdate(
      { _id: newTestPost?.id },
      {
        $set: {
          videoUrl: "videos/fakeVideoPathvideo.png",
        },
      },
      { new: true }
    ).lean();

    const args: MutationRemovePostArgs = {
      id: newTestPost?.id,
    };

    const context = {
      userId: newTestUser?.id,
    };

    const { removePost: removePostResolver } = await import(
      "../../../src/resolvers/Mutation/removePost"
    );

    const removePostPayload = await removePostResolver?.({}, args, context);
    expect(removePostPayload).toEqual(updatedPost);
    expect(deleteVideoSpy).toBeCalledWith("videos/fakeVideoPathvideo.png");
  });
});
