import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { Request, Response } from "express";
import type { Readable } from "stream";
import { s3Client } from "../../../src/config/minio";
import { getFile } from "../../../src/REST/controllers/query";
import type { SdkStreamMixin } from "@aws-sdk/types";

// Mock the s3Client
vi.mock("../../../src/config/minio", () => ({
  s3Client: {
    send: vi.fn(),
  },
  BUCKET_NAME: "test-bucket",
}));

describe("getFile", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    vi.clearAllMocks();

    mockResponse = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      pipe: vi.fn(),
    } as unknown as Response;

    mockRequest = {
      params: {
        "0": "test-file.txt",
      },
    } as unknown as Request;
  });

  const createMockStream = (): Readable & SdkStreamMixin => {
    // Create a minimal mock that implements only what we need
    const mockStream = {
      pipe: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      once: vi.fn().mockReturnThis(),
      emit: vi.fn().mockReturnThis(),
      transformToByteArray: (): Promise<Uint8Array> =>
        Promise.resolve(new Uint8Array()),
      transformToWebStream: (): ReadableStream => new ReadableStream(),
    };

    return mockStream as unknown as Readable & SdkStreamMixin;
  };

  it("should successfully retrieve and stream a file", async () => {
    const mockStream = createMockStream();

    const send = vi.fn().mockImplementation(() =>
      Promise.resolve({
        Body: mockStream,
        ContentType: "text/plain",
        $metadata: {},
      } as GetObjectCommandOutput),
    );

    vi.mocked(s3Client.send).mockImplementation(send);

    await getFile(mockRequest, mockResponse);

    expect(s3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));

    const commandCall = vi.mocked(s3Client.send).mock
      .calls[0][0] as GetObjectCommand;
    expect(commandCall.input).toEqual({
      Bucket: "test-bucket",
      Key: "test-file.txt",
    });

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/plain",
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Cross-Origin-Resource-Policy",
      "same-site",
    );

    expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle errors when retrieving file fails", async () => {
    const mockError = new Error("Failed to retrieve file");
    const send = vi.fn().mockImplementation(() => Promise.reject(mockError));
    vi.mocked(s3Client.send).mockImplementation(send);

    const consoleErrorSpy = vi.spyOn(console, "error");

    await getFile(mockRequest, mockResponse);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching file:",
      mockError,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith(
      "Error occurred while fetching file",
    );
  });

  it("should handle file paths with subdirectories", async () => {
    const mockRequestWithPath = {
      params: {
        "0": "subfolder/nested/test-file.txt",
      },
    } as unknown as Request;

    const mockStream = createMockStream();

    const send = vi.fn().mockImplementation(() =>
      Promise.resolve({
        Body: mockStream,
        ContentType: "text/plain",
        $metadata: {},
      } as GetObjectCommandOutput),
    );

    vi.mocked(s3Client.send).mockImplementation(send);

    await getFile(mockRequestWithPath, mockResponse);

    const commandCall = vi.mocked(s3Client.send).mock
      .calls[0][0] as GetObjectCommand;
    expect(commandCall.input).toEqual({
      Bucket: "test-bucket",
      Key: "subfolder/nested/test-file.txt",
    });
  });
});
