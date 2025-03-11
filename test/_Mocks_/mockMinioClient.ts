import { Readable } from "node:stream";
import { Client as MinioClient } from "minio";
import { vi } from "vitest";

/**
 * Mocked MinIO Client Configuration
 */
const mockMinioConfig = {
	endPoint: "localhost",
	port: 9000,
	bucketName: "talawa" as const,
};

/**
 * Type definition for the mock MinIO client
 */
type MockMinioClient = {
	client: MinioClient;
	config: typeof mockMinioConfig;
	bucketName: typeof mockMinioConfig.bucketName;
};

/**
 * Creates a full mock MinIO client with all required methods
 */
export const createMockMinioClient = (): MockMinioClient => {
	// Creates a fully mocked MinIO client with all required methods
	const mockClient = new MinioClient({
		endPoint: mockMinioConfig.endPoint,
		port: mockMinioConfig.port,
		accessKey: "mock-access-key",
		secretKey: "mock-secret-key",
		useSSL: false,
	});

	// Mocks the necessary methods
	mockClient.bucketExists = vi.fn(
		async (bucketName: string) => bucketName === mockMinioConfig.bucketName,
	);
	mockClient.makeBucket = vi.fn(async () => Promise.resolve());
	mockClient.listBuckets = vi.fn(async () => [
		{ name: mockMinioConfig.bucketName, creationDate: new Date() },
	]);
	mockClient.putObject = vi.fn(async () => ({
		etag: "mock-etag",
		versionId: null,
	}));
	mockClient.getObject = vi.fn(async (bucketName, objectName) => {
		if (bucketName !== mockMinioConfig.bucketName || !objectName) {
			throw new Error("Object not found");
		}
		const stream = new Readable({
			read() {
				this.push("mock file content");
				this.push(null);
			},
		});
		return stream;
	});
	mockClient.removeObject = vi.fn(async () => Promise.resolve());

	return {
		bucketName: mockMinioConfig.bucketName,
		config: mockMinioConfig,
		client: mockClient,
	};
};
