/**
 * Tests for the TSDoc auto-fix script (scripts/fix_tsdoc.ts)
 *
 * These tests verify:
 * - fixParamMissingHyphen with various @param formats
 * - fixReturnsMissingHyphen with present/absent hyphen and edge cases
 * - fixDescriptionTag ensuring text is preserved
 * - fixUnescapedBraces with various brace patterns
 * - Overall fix behavior when no changes needed vs multiple fixes
 */

import { describe, expect, it } from "vitest";

// Re-implement the core functions from fix_tsdoc.ts for testing
// This allows us to test the logic without file I/O

/**
 * Fixes @param tags missing hyphens.
 */
function fixParamMissingHyphen(content: string): string {
	return content.replace(/(@param\s+)(\w+)(\s+)(?!-\s)(\S)/g, "$1$2 - $4");
}

/**
 * Fixes @returns tags missing hyphens.
 */
function fixReturnsMissingHyphen(content: string): string {
	return content.replace(/(@returns\s+)(?!-\s)(\S)/g, "$1- $2");
}

/**
 * Removes @description tags and keeps the text.
 */
function fixDescriptionTag(content: string): string {
	return content.replace(/@description\s+/g, "");
}

/**
 * Escapes curly braces that are not part of inline tags.
 * Skips @throws and @returns lines.
 */
function fixUnescapedBraces(content: string): string {
	return content.replace(/\/\*\*[\s\S]*?\*\//g, (docComment) => {
		return docComment
			.split("\n")
			.map((line) => {
				if (/@throws\s/.test(line) || /@returns\s/.test(line)) {
					return line;
				}
				return line.replace(/\{(?!@)([\w|<>[\],\s.:()=>?!-]+)\}/g, "\\{$1\\}");
			})
			.join("\n");
	});
}

/**
 * Apply all fixes to content and return changes.
 */
function applyFixes(content: string): { result: string; changes: string[] } {
	const changes: string[] = [];
	let result = content;

	const afterParamFix = fixParamMissingHyphen(result);
	if (afterParamFix !== result) {
		changes.push("Fixed @param missing hyphens");
		result = afterParamFix;
	}

	const afterReturnsFix = fixReturnsMissingHyphen(result);
	if (afterReturnsFix !== result) {
		changes.push("Fixed @returns missing hyphens");
		result = afterReturnsFix;
	}

	const afterDescriptionFix = fixDescriptionTag(result);
	if (afterDescriptionFix !== result) {
		changes.push("Removed @description tags");
		result = afterDescriptionFix;
	}

	const afterBracesFix = fixUnescapedBraces(result);
	if (afterBracesFix !== result) {
		changes.push("Escaped curly braces");
		result = afterBracesFix;
	}

	return { result, changes };
}

describe("TSDoc Auto-Fix Script", () => {
	describe("fixParamMissingHyphen", () => {
		it("should add hyphen when missing after param name", () => {
			const input = "* @param name The description";
			const result = fixParamMissingHyphen(input);
			expect(result).toBe("* @param name - The description");
		});

		it("should handle lowercase description start", () => {
			const input = "* @param name the description";
			const result = fixParamMissingHyphen(input);
			expect(result).toBe("* @param name - the description");
		});

		it("should not modify if hyphen already present", () => {
			const input = "* @param name - The description";
			const result = fixParamMissingHyphen(input);
			expect(result).toBe("* @param name - The description");
		});

		it("should handle multiple params", () => {
			const input = `* @param first The first param
* @param second The second param`;
			const result = fixParamMissingHyphen(input);
			expect(result).toBe(`* @param first - The first param
* @param second - The second param`);
		});

		it("should handle extra whitespace between name and description", () => {
			const input = "* @param name    Description";
			const result = fixParamMissingHyphen(input);
			expect(result).toBe("* @param name - Description");
		});

		it("should handle description starting with special characters", () => {
			const input = "* @param name `code` description";
			const result = fixParamMissingHyphen(input);
			expect(result).toBe("* @param name - `code` description");
		});

		it("should handle optional param syntax (without modifying type)", () => {
			const input = "* @param [name] Optional param description";
			// This pattern won't match because [name] doesn't match \w+
			const result = fixParamMissingHyphen(input);
			expect(result).toBe("* @param [name] Optional param description");
		});
	});

	describe("fixReturnsMissingHyphen", () => {
		it("should add hyphen when missing after @returns", () => {
			const input = "* @returns The result";
			const result = fixReturnsMissingHyphen(input);
			expect(result).toBe("* @returns - The result");
		});

		it("should handle lowercase description start", () => {
			const input = "* @returns the result";
			const result = fixReturnsMissingHyphen(input);
			expect(result).toBe("* @returns - the result");
		});

		it("should not modify if hyphen already present", () => {
			const input = "* @returns - The result";
			const result = fixReturnsMissingHyphen(input);
			expect(result).toBe("* @returns - The result");
		});

		it("should handle description starting with inline code", () => {
			const input = "* @returns `null` if not found";
			const result = fixReturnsMissingHyphen(input);
			expect(result).toBe("* @returns - `null` if not found");
		});

		it("should handle description starting with special chars", () => {
			const input = "* @returns {Promise} The promise";
			const result = fixReturnsMissingHyphen(input);
			expect(result).toBe("* @returns - {Promise} The promise");
		});
	});

	describe("fixDescriptionTag", () => {
		it("should remove @description tag and keep text", () => {
			const input = "* @description This is the description";
			const result = fixDescriptionTag(input);
			expect(result).toBe("* This is the description");
		});

		it("should handle multiple @description tags", () => {
			const input = `* @description First description
* @description Second description`;
			const result = fixDescriptionTag(input);
			expect(result).toBe(`* First description
* Second description`);
		});

		it("should preserve surrounding content", () => {
			const input = `/**
 * @description Main description here
 * @param name - The name
 */`;
			const result = fixDescriptionTag(input);
			expect(result).toBe(`/**
 * Main description here
 * @param name - The name
 */`);
		});

		it("should handle @description with extra whitespace", () => {
			const input = "* @description     Lots of spaces";
			const result = fixDescriptionTag(input);
			expect(result).toBe("* Lots of spaces");
		});
	});

	describe("fixUnescapedBraces", () => {
		it("should escape simple type annotation braces", () => {
			const input = `/**
 * Example: {string}
 */`;
			const result = fixUnescapedBraces(input);
			expect(result).toContain("\\{string\\}");
		});

		it("should not escape inline tags like {@link}", () => {
			const input = `/**
 * See {@link SomeClass}
 */`;
			const result = fixUnescapedBraces(input);
			expect(result).toBe(input);
		});

		it("should not escape braces in @throws lines", () => {
			const input = `/**
 * @throws {Error} When something fails
 */`;
			const result = fixUnescapedBraces(input);
			expect(result).toBe(input);
		});

		it("should not escape braces in @returns lines", () => {
			const input = `/**
 * @returns {Promise<void>} The promise
 */`;
			const result = fixUnescapedBraces(input);
			expect(result).toBe(input);
		});

		it("should escape braces in regular description lines", () => {
			const input = `/**
 * Returns an object like {key: value}
 */`;
			const result = fixUnescapedBraces(input);
			expect(result).toContain("\\{key: value\\}");
		});

		it("should handle complex type annotations", () => {
			const input = `/**
 * Type: {Promise<string>}
 */`;
			const result = fixUnescapedBraces(input);
			expect(result).toContain("\\{Promise<string>\\}");
		});

		it("should not escape braces outside doc comments", () => {
			const input = `const obj = {key: "value"};`;
			const result = fixUnescapedBraces(input);
			expect(result).toBe(input);
		});

		it("should escape multiple brace pairs in same comment", () => {
			const input = `/**
 * Use {Option1} or {Option2}
 */`;
			const result = fixUnescapedBraces(input);
			expect(result).toContain("\\{Option1\\}");
			expect(result).toContain("\\{Option2\\}");
		});
	});

	describe("applyFixes (combined behavior)", () => {
		it("should return no changes when content is already valid", () => {
			const input = `/**
 * Valid description.
 * @param name - The name parameter
 * @returns - The result
 */`;
			const { result, changes } = applyFixes(input);
			expect(changes).toHaveLength(0);
			expect(result).toBe(input);
		});

		it("should apply multiple fixes and track changes", () => {
			const input = `/**
 * @description A function description
 * @param name The name parameter
 * @returns The result
 */`;
			const { result, changes } = applyFixes(input);
			expect(changes).toContain("Fixed @param missing hyphens");
			expect(changes).toContain("Fixed @returns missing hyphens");
			expect(changes).toContain("Removed @description tags");
			expect(result).toContain("@param name - The");
			expect(result).toContain("@returns - The");
			expect(result).not.toContain("@description");
		});

		it("should correctly report fixed flag based on changes", () => {
			const validInput = "* @param name - Already valid";
			const { changes: validChanges } = applyFixes(validInput);
			expect(validChanges.length === 0).toBe(true);

			const invalidInput = "* @param name Missing hyphen";
			const { changes: invalidChanges } = applyFixes(invalidInput);
			expect(invalidChanges.length > 0).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should handle empty content", () => {
			const { result, changes } = applyFixes("");
			expect(result).toBe("");
			expect(changes).toHaveLength(0);
		});

		it("should handle content with no doc comments", () => {
			const input = `export function test() {
  return 42;
}`;
			const { result, changes } = applyFixes(input);
			expect(result).toBe(input);
			expect(changes).toHaveLength(0);
		});

		it("should preserve non-doc-comment content", () => {
			const input = `// Regular comment
const x = {key: "value"};
/**
 * @param name The description
 */
function test() {}`;
			const { result } = applyFixes(input);
			expect(result).toContain('const x = {key: "value"}');
			expect(result).toContain("@param name - The");
		});
	});
});
