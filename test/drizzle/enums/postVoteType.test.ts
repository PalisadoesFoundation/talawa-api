import { describe, expect, it } from "vitest";
import { postVoteTypeZodEnum } from "~/src/drizzle/enums/postVoteType";

describe("postVoteTypeZodEnum", () => {
	describe("allow valid vote type", () => {
		it.each([["down_vote"], ["up_vote"]])("should accept %s", (voteType) => {
			const result = postVoteTypeZodEnum.safeParse(voteType);
			expect(result.success).toBe(true);
		});
	});

	describe("rejected MIME types", () => {
		it.each([
			["vote_down"],
			["votedown"],
			["voteDown"],
			["downvote"],
			["vote_up"],
			["voteup"],
			["voteUp"],
			["upvote"],
			["invalid_vote_type"],
		])("should reject %s", (voteType) => {
			const result = postVoteTypeZodEnum.safeParse(voteType);
			expect(result.success).toBe(false);
		});

		it("should reject empty string", () => {
			const result = postVoteTypeZodEnum.safeParse("");
			expect(result.success).toBe(false);
		});

		it("should reject null", () => {
			const result = postVoteTypeZodEnum.safeParse(null);
			expect(result.success).toBe(false);
		});

		it("should reject undefined", () => {
			const result = postVoteTypeZodEnum.safeParse(undefined);
			expect(result.success).toBe(false);
		});

		it("should reject whitespace-only string", () => {
			const result = postVoteTypeZodEnum.safeParse("   ");
			expect(result.success).toBe(false);
		});

		it("should reject valid type with leading/trailing whitespace", () => {
			const result = postVoteTypeZodEnum.safeParse(" down_vote ");
			expect(result.success).toBe(false);
		});
	});

	describe("case sensitivity", () => {
		it("should reject valid type with mixed casing", () => {
			const result = postVoteTypeZodEnum.safeParse("doWn_voTE");
			expect(result.success).toBe(false);
		});

		it("should reject uppercase type", () => {
			const result = postVoteTypeZodEnum.safeParse("DOWN_VOTE");
			expect(result.success).toBe(false);
		});
	});
});
