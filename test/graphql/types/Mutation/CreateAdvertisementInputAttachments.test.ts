import { Readable } from "node:stream";
import { expect, suite, test } from "vitest";
import { mutationCreateAdvertisementInputSchema } from "~/src/graphql/inputs/MutationCreateAdvertisementInput";

suite("MutationCreateAdvertisementInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Advertisement",
		description: "Test description",
		type: "banner" as const,
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-02T10:00:00Z"),
	};

	test("should accept input without attachments (optional field)", async () => {
		const result =
			await mutationCreateAdvertisementInputSchema.safeParseAsync(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.attachments).toBeUndefined();
		}
	});

	test("should accept valid attachments array with single item", async () => {
		const validAttachment = Promise.resolve({
			filename: "test.png",
			mimetype: "image/png",
			encoding: "7bit",
			createReadStream: () => Readable.from(Buffer.from("test")),
		});

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments: [validAttachment],
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.attachments).toBeDefined();
			expect(result.data.attachments?.length).toBe(1);
		}
	});

	test("should reject empty attachments array (minimum 1 required)", async () => {
		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments: [],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["attachments"],
						code: "too_small",
					}),
				]),
			);
		}
	});

	test("should accept maximum allowed attachments (20 items)", async () => {
		const attachments = Array.from({ length: 20 }, (_, i) =>
			Promise.resolve({
				filename: `test${i}.png`,
				mimetype: "image/png",
				encoding: "7bit",
				createReadStream: () => Readable.from(Buffer.from(`test${i}`)),
			}),
		);

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.attachments?.length).toBe(20);
		}
	});

	test("should reject attachments exceeding maximum limit (>20 items)", async () => {
		const attachments = Array.from({ length: 21 }, (_, i) =>
			Promise.resolve({
				filename: `test${i}.png`,
				mimetype: "image/png",
				encoding: "7bit",
				createReadStream: () => Readable.from(Buffer.from(`test${i}`)),
			}),
		);

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["attachments"],
						code: "too_big",
					}),
				]),
			);
		}
	});

	test("should accept multiple attachments within allowed range", async () => {
		const attachments = [
			Promise.resolve({
				filename: "image1.png",
				mimetype: "image/png",
				encoding: "7bit",
				createReadStream: () => Readable.from(Buffer.from("image1")),
			}),
			Promise.resolve({
				filename: "image2.jpg",
				mimetype: "image/jpeg",
				encoding: "7bit",
				createReadStream: () => Readable.from(Buffer.from("image2")),
			}),
			Promise.resolve({
				filename: "video.mp4",
				mimetype: "video/mp4",
				encoding: "7bit",
				createReadStream: () => Readable.from(Buffer.from("video")),
			}),
		];

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.attachments?.length).toBe(3);
		}
	});
});
