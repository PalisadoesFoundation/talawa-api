import { describe, expect, it } from "vitest";
import { eventGenerationWindowsTableInsertSchema } from "~/src/drizzle/tables/eventGenerationWindows";

describe("eventGenerationWindows insert schema numeric bounds", () => {
	// Base object with minimal valid required fields
	const base = {
		organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
		currentWindowEndDate: new Date(),
		retentionStartDate: new Date(),
		createdById: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
	};
	it("required fields validation", () => {
		// Missing organizationId
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				currentWindowEndDate: new Date(),
				retentionStartDate: new Date(),
				createdById: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			}).success,
		).toBe(false);

		// Missing currentWindowEndDate
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
				retentionStartDate: new Date(),
				createdById: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			}).success,
		).toBe(false);

		// Missing retentionStartDate
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
				currentWindowEndDate: new Date(),
				createdById: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			}).success,
		).toBe(false);

		// All required fields present (should succeed)
		const validObj = {
			organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			currentWindowEndDate: new Date(),
			retentionStartDate: new Date(),
			createdById: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
		};
		const result = eventGenerationWindowsTableInsertSchema.safeParse(validObj);
		expect(result.success).toBe(true);
	});

	it("hotWindowMonthsAhead min/max", () => {
		// Valid boundary values
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 1,
			}).success,
		).toBe(true);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 60,
			}).success,
		).toBe(true);

		// Valid middle value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 30,
			}).success,
		).toBe(true);

		// Invalid: below minimum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 0,
			}).success,
		).toBe(false);

		// Invalid: above maximum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 61,
			}).success,
		).toBe(false);

		// Invalid: negative number
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: -1,
			}).success,
		).toBe(false);

		// Invalid: non-integer
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 1.5,
			}).success,
		).toBe(false);

		// Invalid: non-numeric value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: "5" as unknown as number,
			}).success,
		).toBe(false);
	});

	it("historyRetentionMonths min/max", () => {
		// Valid boundary values
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				historyRetentionMonths: 0,
			}).success,
		).toBe(true);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				historyRetentionMonths: 60,
			}).success,
		).toBe(true);

		// Valid middle value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				historyRetentionMonths: 30,
			}).success,
		).toBe(true);

		// Invalid: below minimum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				historyRetentionMonths: -1,
			}).success,
		).toBe(false);

		// Invalid: above maximum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				historyRetentionMonths: 61,
			}).success,
		).toBe(false);

		// Invalid: non-integer
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				historyRetentionMonths: 1.5,
			}).success,
		).toBe(false);

		// Invalid: non-numeric value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				historyRetentionMonths: "10" as unknown as number,
			}).success,
		).toBe(false);
	});

	it("processingPriority min/max", () => {
		// Valid boundary values
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: 1,
			}).success,
		).toBe(true);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: 10,
			}).success,
		).toBe(true);

		// Valid middle value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: 5,
			}).success,
		).toBe(true);

		// Invalid: below minimum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: 0,
			}).success,
		).toBe(false);

		// Invalid: above maximum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: 11,
			}).success,
		).toBe(false);

		// Invalid: negative number
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: -1,
			}).success,
		).toBe(false);

		// Invalid: non-integer
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: 5.5,
			}).success,
		).toBe(false);

		// Invalid: non-numeric value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				processingPriority: "5" as unknown as number,
			}).success,
		).toBe(false);
	});

	it("maxInstancesPerRun min/max", () => {
		// Valid boundary values
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				maxInstancesPerRun: 10,
			}).success,
		).toBe(true);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				maxInstancesPerRun: 10000,
			}).success,
		).toBe(true);

		// Valid middle value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				maxInstancesPerRun: 500,
			}).success,
		).toBe(true);

		// Invalid: below minimum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				maxInstancesPerRun: 9,
			}).success,
		).toBe(false);

		// Invalid: above maximum
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				maxInstancesPerRun: 10001,
			}).success,
		).toBe(false);

		// Invalid: non-integer
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				maxInstancesPerRun: 100.5,
			}).success,
		).toBe(false);

		// Invalid: non-numeric value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				maxInstancesPerRun: "100" as unknown as number,
			}).success,
		).toBe(false);
	});

	it("lastProcessedInstanceCount min", () => {
		// Valid boundary value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastProcessedInstanceCount: 0,
			}).success,
		).toBe(true);

		// Valid positive values
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastProcessedInstanceCount: 100,
			}).success,
		).toBe(true);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastProcessedInstanceCount: 10000,
			}).success,
		).toBe(true);

		// Invalid: negative number
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastProcessedInstanceCount: -1,
			}).success,
		).toBe(false);

		// Invalid: non-integer
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastProcessedInstanceCount: 10.5,
			}).success,
		).toBe(false);

		// Invalid: non-numeric value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastProcessedInstanceCount: "100" as unknown as number,
			}).success,
		).toBe(false);
	});

	it("configurationNotes max length and optional", () => {
		// Valid: within max length
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				configurationNotes: "Short note",
			}).success,
		).toBe(true);

		// Valid: at max length (1024 chars)
		const maxLengthString = "a".repeat(1024);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				configurationNotes: maxLengthString,
			}).success,
		).toBe(true);

		// Valid: empty string
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				configurationNotes: "",
			}).success,
		).toBe(true);

		// Valid: omitted (optional field)
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
			}).success,
		).toBe(true);

		// Invalid: exceeds max length
		const tooLongString = "a".repeat(1025);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				configurationNotes: tooLongString,
			}).success,
		).toBe(false);

		// Invalid: non-string value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				configurationNotes: 123 as unknown as string,
			}).success,
		).toBe(false);
	});

	it("organizationId UUID validation", () => {
		// Valid UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			}).success,
		).toBe(true);

		// Another valid UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				organizationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			}).success,
		).toBe(true);

		// Invalid: not a UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				organizationId: "not-a-uuid",
			}).success,
		).toBe(false);

		// Invalid: missing hyphens
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				organizationId: "3f738d7f22e74bdab47f61f0a9c9c9a1",
			}).success,
		).toBe(false);

		// Invalid: empty string
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				organizationId: "",
			}).success,
		).toBe(false);

		// Invalid: non-string value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				organizationId: 123 as unknown as string,
			}).success,
		).toBe(false);
	});

	it("createdById UUID validation", () => {
		// Valid UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				createdById: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			}).success,
		).toBe(true);

		// Another valid UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				createdById: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			}).success,
		).toBe(true);

		// Invalid: not a UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				createdById: "not-a-uuid",
			}).success,
		).toBe(false);

		// Invalid: missing hyphens
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				createdById: "3f738d7f22e74bdab47f61f0a9c9c9a1",
			}).success,
		).toBe(false);

		// Invalid: empty string
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				createdById: "",
			}).success,
		).toBe(false);

		// Invalid: non-string value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				createdById: 123 as unknown as string,
			}).success,
		).toBe(false);
	});

	it("lastUpdatedById UUID validation and optional", () => {
		// Valid UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastUpdatedById: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			}).success,
		).toBe(true);

		// Another valid UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastUpdatedById: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			}).success,
		).toBe(true);

		// Valid: omitted (optional field)
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
			}).success,
		).toBe(true);

		// Valid: null value (nullable field)
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastUpdatedById: null,
			}).success,
		).toBe(true);

		// Invalid: not a UUID
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastUpdatedById: "not-a-uuid",
			}).success,
		).toBe(false);

		// Invalid: missing hyphens
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastUpdatedById: "3f738d7f22e74bdab47f61f0a9c9c9a1",
			}).success,
		).toBe(false);

		// Invalid: empty string
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastUpdatedById: "",
			}).success,
		).toBe(false);

		// Invalid: non-string value
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				lastUpdatedById: 123 as unknown as string,
			}).success,
		).toBe(false);
	});

	it("currentWindowEndDate date validation", () => {
		// Valid date
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				currentWindowEndDate: new Date("2025-01-01"),
			}).success,
		).toBe(true);

		// Valid: current date
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				currentWindowEndDate: new Date(),
			}).success,
		).toBe(true);

		// Valid: future date
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				currentWindowEndDate: new Date("2030-12-31"),
			}).success,
		).toBe(true);

		// Invalid: string date (not Date object)
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				currentWindowEndDate: "2025-01-01" as unknown as Date,
			}).success,
		).toBe(false);

		// Invalid: timestamp number
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				currentWindowEndDate: Date.now() as unknown as Date,
			}).success,
		).toBe(false);

		// Invalid: null
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				currentWindowEndDate: null as unknown as Date,
			}).success,
		).toBe(false);
	});

	it("retentionStartDate date validation", () => {
		// Valid date
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				retentionStartDate: new Date("2025-01-01"),
			}).success,
		).toBe(true);

		// Valid: current date
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				retentionStartDate: new Date(),
			}).success,
		).toBe(true);

		// Valid: past date
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				retentionStartDate: new Date("2020-01-01"),
			}).success,
		).toBe(true);

		// Invalid: string date (not Date object)
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				retentionStartDate: "2025-01-01" as unknown as Date,
			}).success,
		).toBe(false);

		// Invalid: timestamp number
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				retentionStartDate: Date.now() as unknown as Date,
			}).success,
		).toBe(false);

		// Invalid: null
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				retentionStartDate: null as unknown as Date,
			}).success,
		).toBe(false);
	});

	it("isEnabled boolean validation and optional", () => {
		// Valid: true
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				isEnabled: true,
			}).success,
		).toBe(true);

		// Valid: false
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				isEnabled: false,
			}).success,
		).toBe(true);

		// Valid: omitted (optional field)
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
			}).success,
		).toBe(true);

		// Invalid: string "true"
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				isEnabled: "true" as unknown as boolean,
			}).success,
		).toBe(false);

		// Invalid: number 1
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				isEnabled: 1 as unknown as boolean,
			}).success,
		).toBe(false);

		// Invalid: number 0
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				isEnabled: 0 as unknown as boolean,
			}).success,
		).toBe(false);
	});

	it("accepts a fully valid object with all the fields", () => {
		const completeValidObject = {
			organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
			currentWindowEndDate: new Date("2025-12-31"),
			retentionStartDate: new Date("2024-01-01"),
			hotWindowMonthsAhead: 12,
			historyRetentionMonths: 24,
			processingPriority: 5,
			maxInstancesPerRun: 500,
			lastProcessedInstanceCount: 100,
			configurationNotes: "Production configuration for Q1 2025",
			createdById: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			lastUpdatedById: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
			isEnabled: true,
		};
		const result =
			eventGenerationWindowsTableInsertSchema.safeParse(completeValidObject);
		expect(result.success).toBe(true);
	});
});
