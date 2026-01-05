import * as child_process from "node:child_process";
import * as fs from "node:fs";
import {
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { ErrorHandlingValidator } from "../scripts/validate_error_handling";

// Mock dependencies
vi.mock("node:child_process");
vi.mock("node:fs");
vi.mock("glob", () => ({
	glob: vi.fn(),
}));

describe("ErrorHandlingValidator", () => {
	let validator: ErrorHandlingValidator;

	beforeEach(() => {
		validator = new ErrorHandlingValidator();
		vi.resetAllMocks();
	});

	describe("Pattern Matching", () => {
		it("should include files matching SCAN_PATTERNS", () => {
			const positiveCases = [
				"src/routes/user.ts",
				"src/graphql/types/User/user.ts",
				"src/utilities/date.ts",
				"src/workers/email.ts",
				"src/plugin/loader.ts",
				"scripts/deploy.ts",
				"src/file.json",
				"test/integration/api.test.ts",
				"setup.ts",
			];

			positiveCases.forEach((file) => {
				expect(validator.shouldScanFile(file)).toBe(true);
			});
		});

		it("should exclude files matching EXCLUDE_PATTERNS", () => {
			const negativeCases = [
				"node_modules/some-package/index.ts",
				"dist/index.js",
				"coverage/lcov-report/index.html",
				"docs/api.md",
				"src/types.d.ts",
				"pnpm-lock.yaml",
				"package-lock.json",
				".github/workflows/ci.yml",
				"docker/Dockerfile.yml",
			];

			negativeCases.forEach((file) => {
				expect(validator.shouldScanFile(file)).toBe(false);
			});
		});

		it("should handle edge cases like node_modules_backup", () => {
			expect(
				validator.shouldScanFile("src/utilities/node_modules_backup/index.ts"),
			).toBe(true);

			expect(
				validator.shouldScanFile("src/utilities/node_modules/index.ts"),
			).toBe(false);
		});

		it("should handle .test.ts.backup files correctly", () => {
			expect(validator.shouldScanFile("src/routes/user.test.ts.backup")).toBe(
				false,
			);

			expect(validator.shouldScanFile("src/routes/user_test_helper.ts")).toBe(
				true,
			);
		});

		it("should handle routes_v2 correctly", () => {
			expect(validator.shouldScanFile("src/routes_v2/api.ts")).toBe(true);
		});

		it("should include allowed files in shouldScanFile but exclude them in getFilesToScan", () => {
			const allowedFiles = [
				"src/utilities/errors/errorHandler.ts",
				"src/fastifyPlugins/errorHandler.ts",
				"setup.ts",
				"scripts/config.ts",
			];

			allowedFiles.forEach((file) => {
				expect(validator.shouldScanFile(file)).toBe(true);
				expect(validator.isAllowedFile(file)).toBe(true);
			});
		});
	});

	describe("Multiline Catch Block Detection", () => {
		it("should detect empty catch blocks", () => {
			const content = `
        try {
          doSomething();
        } catch (error) {
        }
      `;
			const blocks = validator.findCatchBlocks(content);
			expect(blocks).toHaveLength(1);
			expect(blocks[0]?.isEmpty).toBe(true);
		});

		it("should detect catch blocks with only comments as empty", () => {
			const content = `
        try {
          doSomething();
        } catch (error) {
          // Just a comment
          /* Another comment */
        }
      `;
			const blocks = validator.findCatchBlocks(content);
			expect(blocks).toHaveLength(1);
			expect(blocks[0]?.isEmpty).toBe(true);
		});

		it("should detect improper error handling", () => {
			const content = `
        try {
          doSomething();
        } catch (error) {
          someUnrelatedCode();
          let x = 5;
        }
      `;
			const blocks = validator.findCatchBlocks(content);
			expect(blocks).toHaveLength(1);
			expect(blocks[0]?.hasImproperHandling).toBe(true);
		});

		it("should detect weak error handling as improper", () => {
			const weakCases = [
				`catch (e) { return null; }`,
				`catch (e) { x = e; }`,
				`catch (e) { result = { error: e }; }`,
				`catch (e) { return someVar; }`,
				`catch (e) { x = new Object(); }`,
				`catch (e) { return; }`,
			];

			weakCases.forEach((code) => {
				const blocks = validator.findCatchBlocks(code);
				expect(blocks[0]?.hasImproperHandling).toBe(true);
			});
		});

		it("should recognize proper handling patterns", () => {
			const properCases = [
				`catch (e) { throw e; }`,
				`catch (e) { console.error(e); }`,
				`catch (e) { logger.error(e); }`,
				`catch (e) { process.exit(1); }`,
				`catch (e) { throw new TalawaGraphQLError(e); }`,
				`catch (e) { return new Error(e); }`,
				`catch (e) { error = new Error(e); }`,
				`catch (e) { error.message = "failed"; }`,
			];

			properCases.forEach((code) => {
				expect(validator.hasProperErrorHandling(code)).toBe(true);
			});
		});

		it("should handle multiline catch blocks correctly", () => {
			const content = `
        try {
            await job();
        } catch (error) {
            console.error(error);
            throw error;
        }
        `;
			const blocks = validator.findCatchBlocks(content);
			expect(blocks).toHaveLength(1);
			expect(blocks[0]?.isEmpty).toBe(false);
			expect(blocks[0]?.hasImproperHandling).toBe(false);
		});

		it("should handle single-line empty catch blocks", () => {
			const content = `try { doSomething(); } catch (e) { }`;
			const blocks = validator.findCatchBlocks(content);
			expect(blocks).toHaveLength(1);
			expect(blocks[0]?.isEmpty).toBe(true);
		});
	});

	describe("Generic Error Detection", () => {
		it("should report generic errors in routes/resolvers", () => {
			const line = 'throw new Error("Generic error");';

			validator.addViolation = vi.fn();
			validator.checkGenericError("src/routes/api.ts", 10, line);

			expect(validator.addViolation).toHaveBeenCalledWith(
				"src/routes/api.ts",
				10,
				"generic_error_usage",
				line,
				expect.stringContaining("Use TalawaRestError"),
			);
		});

		it("should report generic errors in GraphQL resolvers", () => {
			const line = 'throw Error("Generic error");';

			validator.addViolation = vi.fn();
			validator.checkGenericError("src/graphql/types/User/user.ts", 10, line);

			expect(validator.addViolation).toHaveBeenCalledWith(
				"src/graphql/types/User/user.ts",
				10,
				"generic_error_usage",
				line,
				expect.stringContaining("Use TalawaGraphQLError"),
			);
		});

		it("should report generic errors in non-route/resolver files", () => {
			const line = 'throw new Error("Generic error");';
			validator.addViolation = vi.fn();
			validator.checkGenericError("src/utilities/helper.ts", 10, line);

			expect(validator.addViolation).toHaveBeenCalled();
		});

		it("should respect ALLOWED_PATTERNS exemptions", () => {
			const line = 'throw new Error("Generic error");';
			validator.addViolation = vi.fn();
			validator.checkGenericError(
				"src/utilities/errors/errorHandler.ts",
				10,
				line,
			);

			expect(validator.addViolation).not.toHaveBeenCalled();
		});
	});

	describe("Console Usage Enforcement", () => {
		it("should enforce structured logging in ENFORCE_STRUCTURED_LOGGING paths", () => {
			const line = 'console.log("Debug info");';
			validator.addViolation = vi.fn();

			validator.checkConsoleUsage("src/routes/api.ts", 5, line);

			expect(validator.addViolation).toHaveBeenCalledWith(
				"src/routes/api.ts",
				5,
				"console_usage_enforced",
				line,
				expect.any(String),
			);
		});

		it("should enforce structured logging for console.error in restricted paths", () => {
			const line = 'console.error("Error info");';
			validator.addViolation = vi.fn();

			validator.checkConsoleUsage("src/graphql/types/User/user.ts", 5, line);

			expect(validator.addViolation).toHaveBeenCalledWith(
				"src/graphql/types/User/user.ts",
				5,
				"console_usage_enforced",
				line,
				expect.any(String),
			);
		});

		it("should allow console usage in ALLOW_CONSOLE_USAGE paths", () => {
			const line = 'console.log("Plugin log");';
			validator.addViolation = vi.fn();

			validator.checkConsoleUsage("src/plugin/myPlugin.ts", 5, line);

			expect(validator.addViolation).not.toHaveBeenCalled();
		});

		it("should allow console usage in scripts", () => {
			const line = 'console.error("Script error");';
			validator.addViolation = vi.fn();

			validator.checkConsoleUsage("scripts/deploy.ts", 5, line);

			expect(validator.addViolation).not.toHaveBeenCalled();
		});

		it("should discourage console.error in default paths", () => {
			const line = 'console.error("Oops");';
			validator.addViolation = vi.fn();

			validator.checkConsoleUsage("src/utilities/random.ts", 5, line);

			expect(validator.addViolation).toHaveBeenCalledWith(
				"src/utilities/random.ts",
				5,
				"console_error_usage",
				line,
				expect.any(String),
			);
		});

		it("should allow console.log in default paths (not strictly enforced)", () => {
			const line = 'console.log("Info");';
			validator.addViolation = vi.fn();

			validator.checkConsoleUsage("src/utilities/random.ts", 5, line);

			expect(validator.addViolation).not.toHaveBeenCalled();
		});
	});

	describe("Git Operations", () => {
		it("should fall back to full scan if git fails", async () => {
			// Mock git failure
			vi.mocked(child_process.execSync).mockImplementation(() => {
				throw new TalawaRestError({
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: "Git not found",
				});
			});

			// Mock glob to return some files
			const globMock = await import("glob");
			vi.mocked(globMock.glob).mockResolvedValue(["src/routes/found.ts"]);

			const files = await validator.getFilesToScan();
			expect(files).toContain("src/routes/found.ts");
		});

		it("should use CI logic when GITHUB_BASE_REF is set", async () => {
			const originalEnv = process.env;
			let shouldScanFileSpy: MockInstance | undefined;

			try {
				process.env = { ...originalEnv, CI: "true", GITHUB_BASE_REF: "main" };

				vi.mocked(child_process.execSync).mockReturnValue(
					"src/routes/changed.ts\n",
				);

				// Mock shouldScanFile to return true for our test file
				shouldScanFileSpy = vi
					.spyOn(validator, "shouldScanFile")
					.mockReturnValue(true);

				const files = await validator.getFilesToScan();
				expect(files).toContain("src/routes/changed.ts");
				expect(child_process.execSync).toHaveBeenCalledWith(
					expect.stringContaining("git diff --name-only origin/main...HEAD"),
					expect.anything(),
				);
			} finally {
				if (shouldScanFileSpy) {
					shouldScanFileSpy.mockRestore();
				}
				process.env = originalEnv;
			}
		});

		it("should sanitize git refs to prevent command injection", () => {
			const safeRefs = ["develop", "feature/branch-1", "v1.0.0", "origin/main"];
			safeRefs.forEach((ref) => {
				expect(validator.sanitizeGitRef(ref)).toBe(ref);
			});

			const unsafeRefs = [
				"master; rm -rf /",
				"develop$(echo pwned)",
				"origin/main|bash",
				"branch`whoami`",
				"ref(malicious)",
			];
			unsafeRefs.forEach((ref) => {
				expect(() => validator.sanitizeGitRef(ref)).toThrow(
					/Invalid git reference/,
				);
			});
		});

		it("should handle fetch failures gracefully", async () => {
			const originalEnv = process.env;
			let shouldScanFileSpy: MockInstance | undefined;

			try {
				process.env = { ...originalEnv, CI: "true", GITHUB_BASE_REF: "main" };

				// Mock fetch to fail but diff to succeed
				vi.mocked(child_process.execSync)
					.mockImplementationOnce(() => {
						throw new TalawaRestError({
							code: ErrorCode.INTERNAL_SERVER_ERROR,
							message: "Fetch failed",
						});
					})
					.mockReturnValueOnce("src/routes/changed.ts\n");

				// Mock shouldScanFile to return true for our test file
				shouldScanFileSpy = vi
					.spyOn(validator, "shouldScanFile")
					.mockReturnValue(true);

				const files = await validator.getFilesToScan();
				expect(files).toContain("src/routes/changed.ts");
			} finally {
				if (shouldScanFileSpy) {
					shouldScanFileSpy.mockRestore();
				}
				process.env = originalEnv;
			}
		});
	});

	describe("Suppression Mechanism", () => {
		it("should skip suppressed files", async () => {
			const content = `// validate-error-handling-disable\nconsole.log("Bad!");`;
			const filePath = "src/routes/ignored.ts";

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(content);

			await validator.validateFile(filePath);

			expect(validator.result.suppressedFiles).toContain(filePath);
			expect(validator.result.violations).toHaveLength(0);
		});

		it("should not suppress files without the disable comment", async () => {
			const content = `console.error("This should be flagged");`;
			const filePath = "src/utilities/test.ts";

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(content);

			await validator.validateFile(filePath);

			expect(validator.result.suppressedFiles).not.toContain(filePath);
			expect(validator.result.violations.length).toBeGreaterThan(0);
		});
	});

	describe("Fix Mode & Command Injection Prevention", () => {
		it("should use execFileSync to prevent shell injection", () => {
			// Setup violations
			validator.result.violations = [
				{
					filePath: "src/bad.ts",
					lineNumber: 1,
					violationType: "test",
					line: "",
					suggestion: "",
				},
				{
					filePath: "src/worse.ts",
					lineNumber: 2,
					violationType: "test",
					line: "",
					suggestion: "",
				},
			];

			validator.applyFixes();

			expect(child_process.execFileSync).toHaveBeenCalledWith(
				"npx",
				["biome", "check", "--write", "src/bad.ts", "src/worse.ts"],
				expect.objectContaining({
					shell: false,
					stdio: "inherit",
				}),
			);
		});

		it("should reject suspicious file paths", () => {
			validator.result.violations = [
				{
					filePath: "src/bad.ts; rm -rf /",
					lineNumber: 1,
					violationType: "test",
					line: "",
					suggestion: "",
				},
			];

			expect(() => validator.applyFixes()).toThrow(/Suspicious file path/);
		});

		it("should handle path normalization correctly", () => {
			validator.result.violations = [
				{
					filePath: "src/normal.ts",
					lineNumber: 1,
					violationType: "test",
					line: "",
					suggestion: "",
				},
			];

			validator.applyFixes();

			expect(child_process.execFileSync).toHaveBeenCalledWith(
				"npx",
				["biome", "check", "--write", "src/normal.ts"],
				expect.anything(),
			);
		});
	});

	describe("Glob Pattern Matching", () => {
		it("should match simple patterns correctly", () => {
			expect(
				validator.matchesGlobPattern("src/routes/api.ts", "src/routes/*.ts"),
			).toBe(true);
			expect(
				validator.matchesGlobPattern("src/routes/api.js", "src/routes/*.ts"),
			).toBe(false);
		});

		it("should match recursive patterns correctly", () => {
			expect(
				validator.matchesGlobPattern(
					"src/routes/v1/api.ts",
					"src/routes/**/*.ts",
				),
			).toBe(true);
			expect(
				validator.matchesGlobPattern(
					"src/routes/v1/v2/api.ts",
					"src/routes/**/*.ts",
				),
			).toBe(true);
			expect(
				validator.matchesGlobPattern(
					"other/routes/api.ts",
					"src/routes/**/*.ts",
				),
			).toBe(false);
		});

		it("should handle exclusion patterns correctly", () => {
			expect(
				validator.matchesGlobPattern(
					"node_modules/package/index.js",
					"**/node_modules/**",
				),
			).toBe(true);
			expect(
				validator.matchesGlobPattern(
					"src/node_modules/package/index.js",
					"**/node_modules/**",
				),
			).toBe(true);
			expect(
				validator.matchesGlobPattern(
					"src/node_modules_backup/index.js",
					"**/node_modules/**",
				),
			).toBe(false);
		});

		it("should handle test file patterns correctly", () => {
			expect(
				validator.matchesGlobPattern("src/api.test.ts", "**/*.test.ts"),
			).toBe(true);
			expect(
				validator.matchesGlobPattern("src/api.spec.ts", "**/*.spec.ts"),
			).toBe(true);
			expect(
				validator.matchesGlobPattern("src/api.test.ts.backup", "**/*.test.ts"),
			).toBe(false);
		});
	});

	describe("Utility Methods Coverage", () => {
		describe("removeCommentsAndStrings", () => {
			it("should handle mixed content correctly", () => {
				const input = `
            const x = "string"; // comment
            const y = 'string'; /* multi
            line comment */
            const z = \`template\`;
        `;
				const expected = `
            const x =         ;           
            const y =         ;         
                           
            const z =           ;
        `;
				expect(validator.removeCommentsAndStrings(input).trim()).toBe(
					expected.trim(),
				);
			});

			it("should handle escaped quotes in strings", () => {
				const input = `const x = "str\\"ing";`;
				const expected = `const x =           ;`;
				expect(validator.removeCommentsAndStrings(input)).toBe(expected);
			});

			it("should handle template literal interpolation", () => {
				const input = "const x = `val " + "$" + "{a + b} end`;";
				const result = validator.removeCommentsAndStrings(input);
				expect(result).toContain("a + b");
				expect(result).not.toContain("val");
				expect(result).not.toContain("end");
			});

			it("should handle nested template literals", () => {
				const input =
					"const x = `level1 " +
					"$" +
					"{ `level2 " +
					"$" +
					"{level3}` } end1`;";
				const result = validator.removeCommentsAndStrings(input);
				expect(result).toContain("level3");
				expect(result).not.toContain("level1");
				expect(result).not.toContain("level2");
			});

			it("should handle complex nesting of strings and comments", () => {
				const input = `
            /* start */
            const a = "a // not a comment";
            // const b = "b";
            const c = \`c \${ /* inside interpolation */ d } e\`;
        `;
				const result = validator.removeCommentsAndStrings(input);
				expect(result).toContain("const a");
				expect(result).not.toContain("const b");
				expect(result).toContain("const c");
				expect(result).toContain("d");
				expect(result).not.toContain("inside interpolation");
			});
		});

		describe("getLineContent", () => {
			it("should return the line itself if it matches criteria", () => {
				const lines = ["try {", "  doSomething();", "} catch (e) { }"];
				expect(validator.getLineContent(lines, 3)).toBe("} catch (e) { }");
			});

			it("should search nearby lines for catch declaration", () => {
				const lines = [
					"try {",
					"  doSomething();",
					"} catch (e) {",
					"  console.log(e);",
					"}",
				];
				expect(validator.getLineContent(lines, 4)).toBe("} catch (e) {");
			});
		});

		describe("isFileSuppressed", () => {
			it("should not detect suppression after line 10", () => {
				const lines = Array(15).fill("");
				lines[12] = "// validate-error-handling-disable";
				const content = lines.join("\n");
				expect(validator.isFileSuppressed(content)).toBe(false);
			});

			it("should detect suppression in first 10 lines", () => {
				const lines = Array(15).fill("");
				lines[5] = "// validate-error-handling-disable";
				const content = lines.join("\n");
				expect(validator.isFileSuppressed(content)).toBe(true);
			});
		});

		describe("branchExists", () => {
			it("should return true if git command succeeds", () => {
				vi.mocked(child_process.execSync).mockReturnValue("");
				expect(validator.branchExists("main")).toBe(true);
			});

			it("should return false if git command fails", () => {
				vi.mocked(child_process.execSync).mockImplementation(() => {
					throw new TalawaRestError({
						code: ErrorCode.INTERNAL_SERVER_ERROR,
						message: "fatal: not a valid object name",
					});
				});
				expect(validator.branchExists("non-existent")).toBe(false);
			});
		});
	});

	describe("Incremental Scan & CI Logic", () => {
		it("should use local git diff when not in CI", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				CI: undefined,
				GITHUB_BASE_REF: undefined,
			};

			vi.mocked(child_process.execSync)
				// First call for unstaged
				.mockReturnValueOnce("src/file1.ts\n")
				// Second call for staged
				.mockReturnValueOnce("src/file2.ts\n");

			const modified = validator.getModifiedFiles();
			expect(modified).toContain("src/file1.ts");
			expect(modified).toContain("src/file2.ts");
			expect(child_process.execSync).toHaveBeenCalledWith(
				expect.stringContaining("diff --name-only"),
				expect.anything(),
			);

			process.env = originalEnv;
		});

		it("should handle error in local git diff", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				CI: undefined,
				GITHUB_BASE_REF: undefined,
			};

			vi.mocked(child_process.execSync).mockImplementation(() => {
				throw new TalawaRestError({
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: "Git failed",
				});
			});

			expect(() => validator.getModifiedFiles()).toThrow("Git command failed");

			process.env = originalEnv;
		});

		it("checkLineForViolations should delegate correctly", () => {
			const spyGeneric = vi.spyOn(validator, "checkGenericError");
			const spyConsole = vi.spyOn(validator, "checkConsoleUsage");

			validator.checkLineForViolations("file.ts", 1, "code");

			expect(spyGeneric).toHaveBeenCalled();
			expect(spyConsole).toHaveBeenCalled();
		});

		it("validate should handle errors gracefully", async () => {
			vi.spyOn(validator, "getFilesToScan").mockRejectedValue(
				new Error("Scan failed"),
			);
			const exitCode = await validator.validate();
			expect(exitCode).toBe(1);
		});

		it("validate should return 0 if no files to scan", async () => {
			vi.spyOn(validator, "getFilesToScan").mockResolvedValue([]);
			const exitCode = await validator.validate();
			expect(exitCode).toBe(0);
		});
	});

	describe("checkMultilineCatchBlocks Integration", () => {
		it("should identify violations via main method", () => {
			const content = `
                try {
                    fail();
                } catch (e) {
                    // empty
                }
            `;
			const lines = content.split("\n");
			validator.checkMultilineCatchBlocks("test.ts", content, lines);
			expect(validator.result.violations).toHaveLength(1);
			expect(validator.result.violations[0]?.violationType).toBe(
				"empty_catch_block",
			);
		});
	});

	describe("printResults", () => {
		it("should print no violations message when no violations found", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			validator.result.violations = [];
			validator.result.fileCount = 5;

			validator.printResults();

			expect(consoleSpy).toHaveBeenCalledWith(
				"No error handling violations found!",
			);
			expect(consoleSpy).toHaveBeenCalledWith("Scanned 5 files");

			consoleSpy.mockRestore();
		});

		it("should print violations grouped by type", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			validator.result.violations = [
				{
					filePath: "test1.ts",
					lineNumber: 10,
					violationType: "generic_error_in_route_resolver",
					line: 'throw new Error("test");',
					suggestion: "Use TalawaGraphQLError instead",
				},
				{
					filePath: "test2.ts",
					lineNumber: 20,
					violationType: "console_error_usage",
					line: 'console.error("error");',
					suggestion: "Use structured logging",
				},
			];
			validator.result.violationCount = 2;
			validator.result.fileCount = 2;

			validator.printResults();

			expect(consoleSpy).toHaveBeenCalledWith(
				"VIOLATIONS Error handling issues found:\n",
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				"Generic Error Usage in Routes/Resolvers (1 issues):",
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				"Console Error Usage (1 issues):",
			);
			expect(consoleSpy).toHaveBeenCalledWith("Summary: 2 issues in 2 files");

			consoleSpy.mockRestore();
		});

		it("should print suppressed files when present", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			validator.result.suppressedFiles = ["suppressed1.ts", "suppressed2.ts"];
			validator.result.violations = [];

			validator.printResults();

			expect(consoleSpy).toHaveBeenCalledWith("Suppressed files: 2");
			expect(consoleSpy).toHaveBeenCalledWith("   suppressed1.ts (suppressed)");
			expect(consoleSpy).toHaveBeenCalledWith("   suppressed2.ts (suppressed)");

			consoleSpy.mockRestore();
		});
	});
});
