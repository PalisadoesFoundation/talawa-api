import { vi } from "vitest";
vi.mock("minio", () => ({
	Client: vi.fn().mockImplementation(() => ({
		makeRequestStreamAsync: vi.fn(),
		getBucketRegionAsync: vi.fn(),
		bucketExists: vi.fn(),
	})),
}));
