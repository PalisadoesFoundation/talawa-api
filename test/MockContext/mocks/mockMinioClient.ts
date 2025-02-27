import { vi } from "vitest";
import type { Client as MinioClient } from "minio";
import { Readable } from "node:stream";

type UploadedObjectInfo = {
  etag: string;
  versionId: string | null;
};

/**
 * MinIO Mock 
 */
export const createMockMinioClient = (): Partial<MinioClient> => ({
  bucketExists: vi.fn(async (bucketName: string) => bucketName === "talawa"),
  makeBucket: vi.fn(async () => Promise.resolve()),
  listBuckets: vi.fn(async () => [{ name: "talawa", creationDate: new Date() }]),
  putObject: vi.fn(async (): Promise<UploadedObjectInfo> => ({
    etag: "mock-etag",
    versionId: null,
  })),
  getObject: vi.fn(async () => new Readable()), 
  removeObject: vi.fn(async () => Promise.resolve()),
});
