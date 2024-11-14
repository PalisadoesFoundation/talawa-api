import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { Response } from "express";
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
  INTERNAL_SERVER_ERROR,
  LENGTH_VALIDATION_ERROR,
  PLEASE_PROVIDE_TITLE,
  POST_NEEDS_TO_BE_PINNED,
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Post } from "../../../src/models";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import type { InterfaceAuthenticatedRequest } from "../../../src/middleware";
import { updatePost } from "../../../src/REST/controllers/mutation";
import * as fileServices from "../../../src/REST/services/file";
import type { InterfaceUploadedFileResponse } from "../../../src/REST/services/file/uploadFile";
import { createTestPostWithMedia } from "../../helpers/posts";
import type { TestPostType } from "../../helpers/posts";

vi.mock("../../../src/libraries/requestContext", () => ({
  translate: (message: string): string => `Translated ${message}`,
}));

/**
 * module - PostUpdateControllerTests
 * description - Tests for the Post Update controller functionality in a social media/blog platform
 * @packageDocumentation
 *
 * @remarks
 * Test environment uses Vitest with MongoDB for integration testing.
 * File includes mock implementations for file services and translations.
 *
 * Key test scenarios:
 * - Media attachment management (upload/delete)
 * - Post content updates (text/title/pinned status)
 * - Input validation (text: 500 chars, title: 256 chars)
 * - Error handling (auth, post existence, pinned post rules)
 *
 * @see {@link updatePost} - The controller being tested
 * @see {@link InterfaceAuthenticatedRequest} - Request interface
 *
 * @example
 * ```typescript
 * npm run test updatePost.test
 * ```
 */

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testPost: TestPostType;
let MONGOOSE_INSTANCE: typeof mongoose;

interface InterfaceMockResponse extends Omit<Response, "status" | "json"> {
  status(code: number): InterfaceMockResponse;
  json(data: unknown): InterfaceMockResponse;
}

const mockResponse = (): InterfaceMockResponse => {
  const res = {} as InterfaceMockResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];

  // Create a test post
  testPost = await createTestPostWithMedia(testUser?.id, testOrganization?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("controllers -> post -> updatePost", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully update post with file", async () => {
    const mockFileId = new Types.ObjectId();
    const mockFileUploadResponse: InterfaceUploadedFileResponse = {
      _id: mockFileId,
      uri: "test/file/path",
      visibility: "PUBLIC",
      objectKey: "new-test-key",
    };

    vi.spyOn(fileServices, "uploadFile").mockResolvedValueOnce(
      mockFileUploadResponse,
    );
    vi.spyOn(fileServices, "deleteFile").mockResolvedValueOnce({
      success: true,
      message: "File deleted successfully.",
    });

    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        text: "Updated text with new file",
      },
      file: {
        filename: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        originalname: "test.jpg",
        size: 1024,
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(fileServices.uploadFile).toHaveBeenCalled();
    expect(fileServices.deleteFile).toHaveBeenCalledWith(
      "test-file-object-key",
      testPost?.file._id.toString(),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          text: "Updated text with new file",
          file: mockFileId,
        }),
      }),
    );
  });

  it("should successfully update the title of a pinned post", async () => {
    const pinnedPost = await createTestPostWithMedia(
      testUser?.id,
      testOrganization?.id,
      true,
    );

    const req = {
      userId: testUser?.id,
      params: { id: pinnedPost?._id.toString() },
      body: {
        title: "Updated Title",
        pinned: true,
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          title: "Updated Title",
        }),
      }),
    );
  });

  it("should successfully update the pinned status of a post", async () => {
    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        pinned: false,
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          pinned: false,
        }),
      }),
    );
  });

  it("should throw NotFoundError if no user exists with _id === userId", async () => {
    const req = {
      userId: new Types.ObjectId().toString(),
      params: { id: testPost?._id.toString() },
      body: {
        text: "Updated text",
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
    });
  });

  it("should throw NotFoundError if post does not exist", async () => {
    const req = {
      userId: testUser?.id,
      params: { id: new Types.ObjectId().toString() },
      body: {
        text: "Updated text",
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${POST_NOT_FOUND_ERROR.MESSAGE}`,
    });
  });

  it("should throw UnauthorizedError if AppUserProfile is not found", async () => {
    const userWithoutProfileId = await createTestUser();
    await AppUserProfile.findByIdAndDelete(
      userWithoutProfileId?.appUserProfileId,
    );

    const req = {
      userId: userWithoutProfileId?.id,
      params: { id: testPost?._id.toString() },
      body: {
        text: "Updated text",
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
    });
  });

  it("should throw UnauthorizedError if user is not authorized to update post", async () => {
    const [unauthorizedUser] = await createTestUserAndOrganization();

    const req = {
      userId: unauthorizedUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        text: "Unauthorized update",
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
    });
  });

  it("should throw error if trying to add title to unpinned post", async () => {
    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        title: "New Title",
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${POST_NEEDS_TO_BE_PINNED.MESSAGE}`,
    });
  });

  it("should throw error if removing title from pinned post", async () => {
    // First create a pinned post with title
    const pinnedPost = await createTestPostWithMedia(
      testUser?.id,
      testOrganization?.id,
      true,
    );
    const req = {
      userId: testUser?.id,
      params: { id: pinnedPost?.id.toString() },
      body: {
        title: "",
        pinned: true,
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${PLEASE_PROVIDE_TITLE.MESSAGE}`,
    });
  });

  it("should throw error if title exceeds maximum length", async () => {
    const testPost = await createTestPostWithMedia(
      testUser?.id,
      testOrganization?._id,
      true,
    );
    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        title: "a".repeat(257),
        pinned: true,
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
    });
  });

  it("should throw error if text exceeds maximum length", async () => {
    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        text: "a".repeat(501),
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`,
    });
  });

  it("should successfully update post text", async () => {
    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        text: "Updated post text",
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          text: "Updated post text",
        }),
      }),
    );
  });

  it("should handle file upload error gracefully", async () => {
    vi.spyOn(fileServices, "uploadFile").mockRejectedValueOnce(
      new Error("Upload failed"),
    );

    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        text: "Updated text with file",
      },
      file: {
        filename: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        originalname: "test.jpg",
        size: 1024,
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(fileServices.uploadFile).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Upload failed",
    });
  });

  it("should handle non-Error type errors with internal server error message", async () => {
    vi.spyOn(Post, "findOneAndUpdate").mockImplementationOnce(() => {
      throw "Some unknown error";
    });

    const req = {
      userId: testUser?.id,
      params: { id: testPost?._id.toString() },
      body: {
        text: "Updated text",
      },
    } as unknown as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await updatePost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${INTERNAL_SERVER_ERROR.MESSAGE}`,
    });
  });
});
