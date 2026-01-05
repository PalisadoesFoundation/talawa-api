/**
 * Tests for the TSDoc validation script (scripts/check_tsdoc.ts)
 *
 * These tests verify:
 * - Valid TSDoc comments pass validation
 * - Invalid TSDoc syntax is detected
 * - Ignored message IDs are filtered
 * - File discovery (glob + exclusions) works
 * - Reported line/column numbers are accurate
 * - Correct exit codes for pass/fail
 * - Edge cases (empty files, files with no doc comments)
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
	type ParserMessage,
	TSDocConfiguration,
	TSDocParser,
} from "@microsoft/tsdoc";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Re-implement the core functions from check_tsdoc.ts for testing
// This allows us to test the logic without spawning a process

const IGNORED_MESSAGE_IDS = [
	"tsdoc-malformed-inline-tag",
	"tsdoc-escape-right-brace",
	"tsdoc-escape-greater-than",
	"tsdoc-at-sign-in-word",
	"tsdoc-characters-after-block-tag",
];

interface ValidationError {
	filePath: string;
	line: number;
	column: number;
	messageId: string;
	message: string;
}

function extractDocComments(
	content: string,
): Array<{ comment: string; startLine: number; startColumn: number }> {
	const comments: Array<{
		comment: string;
		startLine: number;
		startColumn: number;
	}> = [];

	const docCommentRegex = /\/\*\*[\s\S]*?\*\//g;
	let match = docCommentRegex.exec(content);

	while (match !== null) {
		const beforeMatch = content.substring(0, match.index);
		const lines = beforeMatch.split("\n");
		const startLine = lines.length;
		const lastLine = lines[lines.length - 1];
		const startColumn = lastLine !== undefined ? lastLine.length + 1 : 1;

		comments.push({
			comment: match[0],
			startLine,
			startColumn,
		});

		match = docCommentRegex.exec(content);
	}

	return comments;
}

function validateComment(
	comment: string,
	config: TSDocConfiguration,
): readonly ParserMessage[] {
	const parser = new TSDocParser(config);
	const parserContext = parser.parseString(comment);
	return parserContext.log.messages;
}

function validateFileContent(
	content: string,
	filePath: string,
	config: TSDocConfiguration,
): ValidationError[] {
	const errors: ValidationError[] = [];
	const comments = extractDocComments(content);

	for (const { comment, startLine, startColumn } of comments) {
		const messages = validateComment(comment, config);

		for (const msg of messages) {
			if (IGNORED_MESSAGE_IDS.includes(msg.messageId)) {
				continue;
			}

			const commentLines = comment.substring(0, msg.textRange.pos).split("\n");
			const lineOffset = commentLines.length - 1;

			errors.push({
				filePath,
				line: startLine + lineOffset,
				column:
					lineOffset === 0
						? startColumn + msg.textRange.pos
						: (commentLines[commentLines.length - 1]?.length ?? 0) + 1,
				messageId: msg.messageId,
				message: msg.unformattedText,
			});
		}
	}

	return errors;
}

describe("TSDoc Validation Script", () => {
	let tempDir: string;
	let config: TSDocConfiguration;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsdoc-test-"));
		config = new TSDocConfiguration();
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	describe("extractDocComments", () => {
		it("should extract single doc comment", () => {
			const content = `/** This is a doc comment */\nexport function test() {}`;
			const comments = extractDocComments(content);

			expect(comments).toHaveLength(1);
			expect(comments[0]?.comment).toBe("/** This is a doc comment */");
			expect(comments[0]?.startLine).toBe(1);
			expect(comments[0]?.startColumn).toBe(1);
		});

		it("should extract multiple doc comments", () => {
			const content = `/** First comment */
export function first() {}

/** Second comment */
export function second() {}`;

			const comments = extractDocComments(content);

			expect(comments).toHaveLength(2);
			expect(comments[0]?.comment).toBe("/** First comment */");
			expect(comments[1]?.comment).toBe("/** Second comment */");
		});

		it("should return empty array for file with no doc comments", () => {
			const content = `// Regular comment\nexport function test() {}`;
			const comments = extractDocComments(content);

			expect(comments).toHaveLength(0);
		});

		it("should return empty array for empty file", () => {
			const comments = extractDocComments("");
			expect(comments).toHaveLength(0);
		});

		it("should not match regular block comments", () => {
			const content = `/* This is not a doc comment */\nexport function test() {}`;
			const comments = extractDocComments(content);

			expect(comments).toHaveLength(0);
		});

		it("should correctly calculate line and column for indented comments", () => {
			const content = `export class Test {
    /** Indented comment */
    method() {}
}`;
			const comments = extractDocComments(content);

			expect(comments).toHaveLength(1);
			expect(comments[0]?.startLine).toBe(2);
			expect(comments[0]?.startColumn).toBe(5); // 4 spaces + 1
		});
	});

	describe("validateComment", () => {
		it("should pass for valid TSDoc comment", () => {
			const comment = `/**
 * A valid description.
 * @param name - The name parameter
 * @returns The result
 */`;
			const messages = validateComment(comment, config);

			// Filter out ignored messages
			const errors = messages.filter(
				(m) => !IGNORED_MESSAGE_IDS.includes(m.messageId),
			);
			expect(errors).toHaveLength(0);
		});

		it("should detect missing hyphen after @param", () => {
			const comment = `/**
 * Description.
 * @param name The name without hyphen
 */`;
			const messages = validateComment(comment, config);

			const paramErrors = messages.filter(
				(m) => m.messageId === "tsdoc-param-tag-missing-hyphen",
			);
			expect(paramErrors.length).toBeGreaterThan(0);
		});

		it("should detect undefined TSDoc tags", () => {
			const comment = `/**
 * @unknowntag This is not a valid tag
 */`;
			const messages = validateComment(comment, config);

			const undefinedTagErrors = messages.filter(
				(m) => m.messageId === "tsdoc-undefined-tag",
			);
			expect(undefinedTagErrors.length).toBeGreaterThan(0);
		});
	});

	describe("ignored message IDs", () => {
		it("should filter out tsdoc-malformed-inline-tag", () => {
			const content = `/**
 * Example: { "key": "value" }
 */
export const x = 1;`;
			const errors = validateFileContent(content, "test.ts", config);

			const malformedErrors = errors.filter(
				(e) => e.messageId === "tsdoc-malformed-inline-tag",
			);
			expect(malformedErrors).toHaveLength(0);
		});

		it("should filter out tsdoc-escape-right-brace", () => {
			const content = `/**
 * Example: { "key": "value" }
 */
export const x = 1;`;
			const errors = validateFileContent(content, "test.ts", config);

			const braceErrors = errors.filter(
				(e) => e.messageId === "tsdoc-escape-right-brace",
			);
			expect(braceErrors).toHaveLength(0);
		});

		it("should filter out tsdoc-at-sign-in-word", () => {
			const content = `/**
 * Email: user@example.com
 */
export const x = 1;`;
			const errors = validateFileContent(content, "test.ts", config);

			const atSignErrors = errors.filter(
				(e) => e.messageId === "tsdoc-at-sign-in-word",
			);
			expect(atSignErrors).toHaveLength(0);
		});

		it("should NOT filter out real errors like tsdoc-param-tag-missing-hyphen", () => {
			const content = `/**
 * @param name The description without hyphen
 */
export function test(name: string) {}`;
			const errors = validateFileContent(content, "test.ts", config);

			const paramErrors = errors.filter(
				(e) => e.messageId === "tsdoc-param-tag-missing-hyphen",
			);
			expect(paramErrors.length).toBeGreaterThan(0);
		});
	});

	describe("line and column accuracy", () => {
		it("should report correct line number for single-line comment error", () => {
			const content = `/**
 * @param name Missing hyphen
 */
export function test(name: string) {}`;
			const errors = validateFileContent(content, "test.ts", config);

			expect(errors.length).toBeGreaterThan(0);
			// The @param is on line 2
			const paramError = errors.find(
				(e) => e.messageId === "tsdoc-param-tag-missing-hyphen",
			);
			expect(paramError?.line).toBe(2);
		});

		it("should report correct line number for multi-line comment", () => {
			const content = `// Some code
const x = 1;

/**
 * First valid line
 * @param name Missing hyphen
 */
export function test(name: string) {}`;

			const errors = validateFileContent(content, "test.ts", config);
			const paramError = errors.find(
				(e) => e.messageId === "tsdoc-param-tag-missing-hyphen",
			);

			// The doc comment starts at line 4, @param is on line 6
			expect(paramError?.line).toBe(6);
		});

		it("should handle column calculation correctly with operator precedence fix", () => {
			// This test validates the fix for: (length ?? 0) + 1 instead of (length ?? 0 + 1)
			// The @param tag is on line 2 of the comment, so lineOffset > 0
			const content = `/**
 * @param name Missing hyphen
 */
export function test(name: string) {}`;

			const errors = validateFileContent(content, "test.ts", config);
			const paramError = errors.find(
				(e) => e.messageId === "tsdoc-param-tag-missing-hyphen",
			);

			// Assert error is defined
			expect(paramError).toBeDefined();
			// The error is on line 2 (second line of comment)
			expect(paramError?.line).toBe(2);
			// Column is calculated as: (lastLineLength ?? 0) + 1
			// The " * " prefix before @param has length 3, so column = 3 + 1 = 4
			// This specifically tests the operator precedence fix
			// Bug would give: (3 ?? 0 + 1) = (3 ?? 1) = 3 (wrong)
			// Fix gives: (3 ?? 0) + 1 = 3 + 1 = 4 (correct)
			expect(paramError?.column).toBe(4);
		});
	});

	describe("file validation", () => {
		it("should return empty errors for valid file", () => {
			const content = `/**
 * A valid function.
 * @param name - The name parameter
 * @returns - The greeting
 */
export function greet(name: string): string {
    return \`Hello, \${name}\`;
}`;
			const errors = validateFileContent(content, "test.ts", config);
			expect(errors).toHaveLength(0);
		});

		it("should detect multiple errors in one file", () => {
			const content = `/**
 * @param a Missing hyphen
 */
export function first(a: string) {}

/**
 * @param b Missing hyphen
 */
export function second(b: string) {}`;

			const errors = validateFileContent(content, "test.ts", config);
			expect(errors.length).toBeGreaterThanOrEqual(2);
		});

		it("should handle empty file", () => {
			const errors = validateFileContent("", "empty.ts", config);
			expect(errors).toHaveLength(0);
		});

		it("should handle file with no doc comments", () => {
			const content = `// Regular comments only
export function test() {
    return 42;
}`;
			const errors = validateFileContent(content, "test.ts", config);
			expect(errors).toHaveLength(0);
		});

		it("should handle file with only code (no comments)", () => {
			const content = `export function add(a: number, b: number): number {
    return a + b;
}

export const PI = 3.14159;`;
			const errors = validateFileContent(content, "test.ts", config);
			expect(errors).toHaveLength(0);
		});
	});

	describe("edge cases", () => {
		it("should handle doc comment at end of file without newline", () => {
			const content = `/** Final comment */`;
			const comments = extractDocComments(content);

			expect(comments).toHaveLength(1);
			expect(comments[0]?.comment).toBe("/** Final comment */");
		});

		it("should handle nested asterisks in doc comment", () => {
			const content = `/**
 * Multiplies a * b
 * @param a - First number
 * @param b - Second number
 */
export function multiply(a: number, b: number) { return a * b; }`;
			const errors = validateFileContent(content, "test.ts", config);
			expect(errors).toHaveLength(0);
		});

		it("should handle doc comment with code blocks", () => {
			const content = `/**
 * Example usage:
 * \`\`\`typescript
 * const result = test();
 * \`\`\`
 */
export function test() {}`;
			const comments = extractDocComments(content);
			expect(comments).toHaveLength(1);
		});

		it("should handle consecutive doc comments", () => {
			const content = `/** First *//** Second */`;
			const comments = extractDocComments(content);
			expect(comments).toHaveLength(2);
		});

		it("should handle doc comment with unicode characters", () => {
			const content = `/**
 * Handles émojis and ünïcödé 🎉
 * @param name - The name with special chars
 */
export function greet(name: string) {}`;
			const errors = validateFileContent(content, "test.ts", config);
			expect(errors).toHaveLength(0);
		});
	});

	describe("main() entrypoint integration tests", () => {
		// Integration tests use child processes to test the actual script behavior

		describe("CLI-args mode", () => {
			it("should filter out .d.ts files from CLI arguments", async () => {
				// Create test files
				const validTsFile = path.join(tempDir, "valid.ts");
				const dtsFile = path.join(tempDir, "types.d.ts");

				fs.writeFileSync(
					validTsFile,
					`/**
 * Valid function.
 * @param name - The name
 */
export function test(name: string) {}`,
				);
				fs.writeFileSync(dtsFile, `export declare const x: string;`);

				// Set up argv with both .ts and .d.ts files
				process.argv = ["node", "check_tsdoc.ts", validTsFile, dtsFile];

				// Import and run main dynamically
				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ stdout: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", validTsFile, dtsFile],
							{
								cwd: path.join(process.cwd()),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let stdout = "";
						child.stdout?.on("data", (data) => {
							stdout += data.toString();
						});
						child.stderr?.on("data", (data) => {
							stdout += data.toString();
						});
						child.on("close", (code) => {
							resolve({ stdout, code: code ?? 0 });
						});
					},
				);

				// Should pass because .d.ts is filtered out
				expect(result.code).toBe(0);
				expect(result.stdout).toContain("TSDoc validation passed for 1 file");
			});

			it("should process only .ts files passed as arguments", async () => {
				const tsFile = path.join(tempDir, "test.ts");
				fs.writeFileSync(
					tsFile,
					`/**
 * @param name - Valid param
 */
export function test(name: string) {}`,
				);

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ stdout: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", tsFile],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let stdout = "";
						child.stdout?.on("data", (data) => {
							stdout += data.toString();
						});
						child.stderr?.on("data", (data) => {
							stdout += data.toString();
						});
						child.on("close", (code) => {
							resolve({ stdout, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(0);
				expect(result.stdout).toContain("TSDoc validation passed");
			});
		});

		describe("glob mode (no args)", () => {
			it("should glob files from src/ directory when no args provided", async () => {
				// This test validates the glob mode by running from the repo root
				// The script will glob src/**/*.ts from process.cwd()
				// Since we can't easily mock the cwd, we verify the script runs
				// successfully when executed from the project root
				const { spawn } = await import("node:child_process");
				const repoRoot = process.cwd();

				const result = await new Promise<{ stdout: string; code: number }>(
					(resolve) => {
						const child = spawn("npx", ["tsx", "scripts/check_tsdoc.ts"], {
							cwd: repoRoot,
							stdio: ["pipe", "pipe", "pipe"],
							env: { ...process.env },
						});
						let stdout = "";
						child.stdout?.on("data", (data) => {
							stdout += data.toString();
						});
						child.stderr?.on("data", (data) => {
							stdout += data.toString();
						});
						child.on("close", (code) => {
							resolve({ stdout, code: code ?? 0 });
						});
					},
				);

				// Should successfully find and validate files in src/
				// Exit code 0 = all valid, 1 = found errors (both are valid outcomes)
				// The key is that glob mode executes without crashing
				expect([0, 1]).toContain(result.code);
				// Should output file count (either passed or found errors)
				expect(result.stdout).toMatch(/file\(s\)/);
			});
		});

		describe("no files path", () => {
			it("should output 'No TypeScript files to check' and exit 0 when no files found", async () => {
				// This test validates the "no files" path by passing only non-.ts arguments
				// When filtering removes all files, it should report "No TypeScript files"
				const nonTsFile = path.join(tempDir, "readme.md");
				fs.writeFileSync(nonTsFile, "# Readme");

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ stdout: string; code: number }>(
					(resolve) => {
						// Pass a non-.ts file as argument - it should be filtered out
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", nonTsFile],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let stdout = "";
						child.stdout?.on("data", (data) => {
							stdout += data.toString();
						});
						child.stderr?.on("data", (data) => {
							stdout += data.toString();
						});
						child.on("close", (code) => {
							resolve({ stdout, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(0);
				expect(result.stdout).toContain("No TypeScript files to check");
			});

			it("should exit 0 when only .d.ts files are provided as args", async () => {
				const dtsFile = path.join(tempDir, "types.d.ts");
				fs.writeFileSync(dtsFile, `export declare const x: string;`);

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ stdout: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", dtsFile],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let stdout = "";
						child.stdout?.on("data", (data) => {
							stdout += data.toString();
						});
						child.stderr?.on("data", (data) => {
							stdout += data.toString();
						});
						child.on("close", (code) => {
							resolve({ stdout, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(0);
				expect(result.stdout).toContain("No TypeScript files to check");
			});
		});

		describe("error aggregation from multiple files", () => {
			it("should aggregate errors from multiple files and exit 1", async () => {
				const file1 = path.join(tempDir, "file1.ts");
				const file2 = path.join(tempDir, "file2.ts");

				// Files with TSDoc errors (missing hyphen after @param)
				fs.writeFileSync(
					file1,
					`/**
 * @param a Missing hyphen
 */
export function first(a: string) {}`,
				);
				fs.writeFileSync(
					file2,
					`/**
 * @param b Missing hyphen
 */
export function second(b: string) {}`,
				);

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{
					stdout: string;
					stderr: string;
					code: number;
				}>((resolve) => {
					const child = spawn(
						"npx",
						["tsx", "scripts/check_tsdoc.ts", file1, file2],
						{
							cwd: process.cwd(),
							stdio: ["pipe", "pipe", "pipe"],
						},
					);
					let stdout = "";
					let stderr = "";
					child.stdout?.on("data", (data) => {
						stdout += data.toString();
					});
					child.stderr?.on("data", (data) => {
						stderr += data.toString();
					});
					child.on("close", (code) => {
						resolve({ stdout, stderr, code: code ?? 0 });
					});
				});

				expect(result.code).toBe(1);
				// Check that both files are mentioned in output
				const output = result.stdout + result.stderr;
				expect(output).toContain("file1.ts");
				expect(output).toContain("file2.ts");
				expect(output).toContain("tsdoc-param-tag-missing-hyphen");
				expect(output).toContain("TSDoc error(s)");
			});

			it("should report correct error count for multiple errors", async () => {
				const file = path.join(tempDir, "multi-error.ts");
				fs.writeFileSync(
					file,
					`/**
 * @param a Missing hyphen
 */
export function first(a: string) {}

/**
 * @param b Missing hyphen
 */
export function second(b: string) {}`,
				);

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ output: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", file],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let output = "";
						child.stdout?.on("data", (data) => {
							output += data.toString();
						});
						child.stderr?.on("data", (data) => {
							output += data.toString();
						});
						child.on("close", (code) => {
							resolve({ output, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(1);
				// Should indicate multiple errors were found
				expect(result.output).toMatch(/Found \d+ TSDoc error/);
			});
		});

		describe("success path", () => {
			it("should exit 0 and show success message for valid files", async () => {
				const validFile = path.join(tempDir, "valid.ts");
				fs.writeFileSync(
					validFile,
					`/**
 * A valid function.
 * @param name - The name parameter
 * @returns The greeting
 */
export function greet(name: string): string {
    return \`Hello, \${name}\`;
}`,
				);

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ stdout: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", validFile],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let stdout = "";
						child.stdout?.on("data", (data) => {
							stdout += data.toString();
						});
						child.stderr?.on("data", (data) => {
							stdout += data.toString();
						});
						child.on("close", (code) => {
							resolve({ stdout, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(0);
				expect(result.stdout).toContain("TSDoc validation passed");
				expect(result.stdout).toContain("1 file(s)");
			});

			it("should handle multiple valid files", async () => {
				const file1 = path.join(tempDir, "valid1.ts");
				const file2 = path.join(tempDir, "valid2.ts");

				fs.writeFileSync(
					file1,
					`/**
 * @param x - Valid param
 */
export function test1(x: string) {}`,
				);
				fs.writeFileSync(
					file2,
					`/**
 * @param y - Valid param
 */
export function test2(y: string) {}`,
				);

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ stdout: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", file1, file2],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let stdout = "";
						child.stdout?.on("data", (data) => {
							stdout += data.toString();
						});
						child.stderr?.on("data", (data) => {
							stdout += data.toString();
						});
						child.on("close", (code) => {
							resolve({ stdout, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(0);
				expect(result.stdout).toContain("TSDoc validation passed");
				expect(result.stdout).toContain("2 file(s)");
			});
		});

		describe("top-level catch handler", () => {
			it("should catch and log errors from main() and exit 1", async () => {
				// Pass a non-existent file to trigger a file read error
				const nonExistentFile = path.join(tempDir, "does-not-exist.ts");

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ output: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", nonExistentFile],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let output = "";
						child.stdout?.on("data", (data) => {
							output += data.toString();
						});
						child.stderr?.on("data", (data) => {
							output += data.toString();
						});
						child.on("close", (code) => {
							resolve({ output, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(1);
				expect(result.output).toContain("TSDoc validation failed");
				expect(result.output).toContain("ENOENT");
			});

			it("should report file path in error message when file read fails", async () => {
				const nonExistentFile = path.join(tempDir, "missing-file.ts");

				const { spawn } = await import("node:child_process");
				const result = await new Promise<{ output: string; code: number }>(
					(resolve) => {
						const child = spawn(
							"npx",
							["tsx", "scripts/check_tsdoc.ts", nonExistentFile],
							{
								cwd: process.cwd(),
								stdio: ["pipe", "pipe", "pipe"],
							},
						);
						let output = "";
						child.stdout?.on("data", (data) => {
							output += data.toString();
						});
						child.stderr?.on("data", (data) => {
							output += data.toString();
						});
						child.on("close", (code) => {
							resolve({ output, code: code ?? 0 });
						});
					},
				);

				expect(result.code).toBe(1);
				expect(result.output).toContain("missing-file.ts");
			});
		});
	});
});
