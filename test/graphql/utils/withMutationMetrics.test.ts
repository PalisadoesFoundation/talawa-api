import { describe, expect, it } from "vitest";
import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";

describe("withMutationMetrics", () => {
	describe("operation name validation", () => {
		it("should throw when operationName is empty", () => {
			const resolver = async () => ({ id: "1" });

			expect(() =>
				withMutationMetrics(
					{
						operationName: "",
					},
					resolver,
				),
			).toThrow("Operation name cannot be empty or whitespace");
		});

		it("should throw when operationName is whitespace only", () => {
			const resolver = async () => ({ id: "1" });

			expect(() =>
				withMutationMetrics(
					{
						operationName: "   \t\n  ",
					},
					resolver,
				),
			).toThrow("Operation name cannot be empty or whitespace");
		});

		it("should throw when operationName does not match mutation:{mutationName} pattern (missing prefix)", () => {
			const resolver = async () => ({ id: "1" });

			expect(() =>
				withMutationMetrics(
					{
						operationName: "createUser",
					},
					resolver,
				),
			).toThrow(
				/Operation name must match the format "mutation:\{mutationName\}" \(e\.g\. mutation:createUser\)\. Got: "createUser"/,
			);
		});

		it("should throw when operationName does not match mutation:{mutationName} pattern (invalid characters)", () => {
			const resolver = async () => ({ id: "1" });

			expect(() =>
				withMutationMetrics(
					{
						operationName: "mutation:bad-name!",
					},
					resolver,
				),
			).toThrow(
				/Operation name must match the format "mutation:\{mutationName\}" \(e\.g\. mutation:createUser\)\. Got: "mutation:bad-name!"/,
			);
		});

		it("should not throw when operationName is valid", () => {
			const resolver = async () => ({ id: "1" });

			expect(() =>
				withMutationMetrics(
					{
						operationName: "mutation:createUser",
					},
					resolver,
				),
			).not.toThrow();
		});

		it("should not throw when operationName has underscores and digits", () => {
			const resolver = async () => ({ id: "1" });

			expect(() =>
				withMutationMetrics(
					{
						operationName: "mutation:update_org_2",
					},
					resolver,
				),
			).not.toThrow();
		});
	});
});
