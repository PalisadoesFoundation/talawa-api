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
  INVALID_FILE_TYPE,
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  PLEASE_PROVIDE_TITLE,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../../src/constants";
import { AppUserProfile, Organization, Post } from "../../../src/models";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import type { InterfaceAuthenticatedRequest } from "../../../src/middleware";
import { createPost } from "../../../src/REST/controllers/mutation";
import * as uploadFileService from "../../../src/REST/services/file";
import type { InterfaceUploadedFileResponse } from "../../../src/REST/services/file/uploadFile";

vi.mock("../../../src/libraries/requestContext", () => ({
  translate: (message: string): string => `Translated ${message}`,
}));

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

interface InterfaceMockResponse extends Omit<Response, "status" | "json"> {
  status(code: number): InterfaceMockResponse;
  json(data: unknown): InterfaceMockResponse;
}

// Mock response object with proper return type
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
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("controllers -> post -> createPost", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw NotFoundError if no user exists with _id === userId", async () => {
    const req = {
      userId: new Types.ObjectId().toString(),
      body: {
        organizationId: testOrganization?._id,
        text: "Test post",
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
    });
  });

  it("should throw NotFoundError if no organization exists with _id === organizationId", async () => {
    const req = {
      userId: testUser?.id,
      body: {
        organizationId: new Types.ObjectId().toString(),
        text: "Test post",
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
    });
  });

  it("should throw UnauthorizedError if AppUserProfile is not found", async () => {
    const userWithoutProfileId = await createTestUser();
    await AppUserProfile.findByIdAndDelete(
      userWithoutProfileId?.appUserProfileId,
    );

    const req = {
      userId: userWithoutProfileId?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post",
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
    });
  });

  it("should throw error if user is not member of the organization and is not superadmin", async () => {
    const [nonMemberUser] = await createTestUserAndOrganization(false);

    const req = {
      userId: nonMemberUser?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post",
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE}`,
    });
  });

  it("should throw error if trying to pin post without proper authorization", async () => {
    const [nonAdminUser, nonAdminOrg] = await createTestUserAndOrganization(
      true,
      false,
    );

    const req = {
      userId: nonAdminUser?.id,
      body: {
        organizationId: nonAdminOrg?._id,
        text: "Test post",
        title: "Test title",
        pinned: true,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${USER_NOT_AUTHORIZED_TO_PIN.MESSAGE}`,
    });
  });

  it("should throw error if pinned post has no title", async () => {
    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post",
        pinned: true,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${PLEASE_PROVIDE_TITLE.MESSAGE}`,
    });
  });

  it("should throw error if title exceeds maximum length", async () => {
    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        title: "a".repeat(257),
        text: "Test post",
        pinned: true,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
    });
  });

  it("should throw error if text exceeds maximum length", async () => {
    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        title: "Test title",
        text: "a".repeat(501),
        pinned: true,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`,
    });
  });

  it("should successfully create a regular post", async () => {
    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post",
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          text: "Test post",
          pinned: false,
        }),
      }),
    );
  });

  it("should successfully create a pinned post", async () => {
    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        title: "Test pinned post",
        text: "Test post content",
        pinned: true,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          title: "Test pinned post",
          text: "Test post content",
          pinned: true,
        }),
      }),
    );

    // Verify organization was updated with pinned post
    const updatedOrg = await Organization.findById(testOrganization?._id);
    const createdPost = await Post.findOne({ title: "Test pinned post" });
    expect(updatedOrg?.pinnedPosts).toContainEqual(createdPost?._id);
  });

  it("should successfully create a post with file upload", async () => {
    const mockFileId = new Types.ObjectId();
    const mockFileUploadResponse: InterfaceUploadedFileResponse = {
      _id: mockFileId,
      uri: "test/file/path",
      visibility: "PUBLIC",
      objectKey: "test-object-key",
    };

    vi.spyOn(uploadFileService, "uploadFile").mockResolvedValueOnce(
      mockFileUploadResponse,
    );

    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post with file",
      },
      file: {
        filename: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        originalname: "test.jpg",
        size: 1024,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(uploadFileService.uploadFile).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          text: "Test post with file",
          file: mockFileId,
        }),
      }),
    );
  });

  it("should handle file upload error gracefully", async () => {
    vi.spyOn(uploadFileService, "uploadFile").mockRejectedValueOnce(
      new Error("Upload failed"),
    );

    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post with file",
      },
      file: {
        filename: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        originalname: "test.jpg",
        size: 1024,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(uploadFileService.uploadFile).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Upload failed",
    });
  });

  it("should handle invalid file type", async () => {
    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post with file",
      },
      file: {
        filename: "test.exe",
        mimetype: "application/x-msdownload",
        buffer: Buffer.from("test"),
        originalname: "test.exe",
        size: 1024,
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${INVALID_FILE_TYPE.MESSAGE}`,
    });
  });

  it("should handle non-Error type errors with internal server error message", async () => {
    // Mock User.findOne to throw a non-Error type error
    vi.spyOn(Post, "create").mockImplementationOnce(() => {
      throw "Some unknown error";
    });

    const req = {
      userId: testUser?.id,
      body: {
        organizationId: testOrganization?._id,
        text: "Test post",
      },
    } as InterfaceAuthenticatedRequest;

    const res = mockResponse();
    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: `Translated ${INTERNAL_SERVER_ERROR.MESSAGE}`,
    });
  });
});
