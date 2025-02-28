import { Readable } from "node:stream";
import type { Client as MinioClient } from "minio";
import { vi } from "vitest";

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
	listBuckets: vi.fn(async () => [
		{ name: "talawa", creationDate: new Date() },
	]),
	putObject: vi.fn(
		async (): Promise<UploadedObjectInfo> => ({
			etag: "mock-etag",
			versionId: null,
		}),
	),
	getObject: vi.fn(async (bucketName, objectName) => {
		if (bucketName !== "talawa" || !objectName) {
			throw new Error("Object not found");
		}

		const stream = new Readable({
			read() {
				this.push("mock file content");
				this.push(null); // Indicate end of stream
			},
		});

		return stream;
	}),
	removeObject: vi.fn(async () => Promise.resolve()),
});
