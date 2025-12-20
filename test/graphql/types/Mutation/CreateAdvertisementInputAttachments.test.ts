import { Readable } from "node:stream";
import type { FileUpload } from "graphql-upload-minimal";
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

	const makeFileUpload = (
		filename: string,
		mimetype: string,
		content: string,
	): Promise<FileUpload> => {
		return Promise.resolve({
			filename,
			mimetype,
			encoding: "7bit",
			createReadStream: () => Readable.from(Buffer.from(content)),
		} as FileUpload);
	};

	test("should accept single valid attachment", async () => {
		const attachment = makeFileUpload("test.png", "image/png", "test");

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments: [attachment],
		});

		expect(result.success).toBe(true);

		if (result.success && result.data.attachments) {
			const resolved = await Promise.all(result.data.attachments);
			expect(resolved).toHaveLength(1);
			expect(resolved[0]?.filename).toBe("test.png");
		}
	});

	test("should accept multiple attachments up to max limit", async () => {
		const attachments = Array.from({ length: 20 }, (_, i) =>
			makeFileUpload(`file${i}.png`, "image/png", `content${i}`),
		);

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments,
		});

		expect(result.success).toBe(true);

		if (result.success && result.data.attachments) {
			const resolved = await Promise.all(result.data.attachments);
			expect(resolved).toHaveLength(20);
		}
	});

	test("should reject empty attachments array", async () => {
		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments: [],
		});

		expect(result.success).toBe(false);

		if (!result.success) {
			const issues = result.error.issues;
			expect(
				issues.some(
					(issue) =>
						issue.path.includes("attachments") &&
						issue.message.includes("at least"),
				),
			).toBe(true);
		}
	});

	test("should reject more than 20 attachments", async () => {
		const attachments = Array.from({ length: 21 }, (_, i) =>
			makeFileUpload(`file${i}.png`, "image/png", `content${i}`),
		);

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments,
		});

		expect(result.success).toBe(false);

		if (!result.success) {
			const issues = result.error.issues;
			expect(
				issues.some(
					(issue) =>
						issue.path.includes("attachments") &&
						issue.message.includes("at most"),
				),
			).toBe(true);
		}
	});

	test("should accept input without attachments field", async () => {
		const result =
			await mutationCreateAdvertisementInputSchema.safeParseAsync(validInput);

		expect(result.success).toBe(true);

		if (result.success) {
			expect(result.data.attachments).toBeUndefined();
		}
	});

	test("should accept any mime type in schema validation", async () => {
		// Schema does NOT validate mime types - that happens in resolver
		const textFile = makeFileUpload("test.txt", "text/plain", "content");

		const result = await mutationCreateAdvertisementInputSchema.safeParseAsync({
			...validInput,
			attachments: [textFile],
		});

		expect(result.success).toBe(true);
	});
});
