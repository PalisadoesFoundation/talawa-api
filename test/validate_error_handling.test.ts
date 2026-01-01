import * as child_process from "node:child_process";
import * as fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
				"src/graphql/resolvers/Mutation/updateUser.ts",
				"src/REST/auth/login.ts",
				"src/utilities/date.ts",
				"src/workers/email.ts",
				"src/plugin/loader.ts",
				"scripts/deploy.ts",
			];

			positiveCases.forEach((file) => {
				expect(validator.shouldScanFile(file)).toBe(true);
			});
		});

		it("should exclude files matching EXCLUDE_PATTERNS", () => {
			const negativeCases = [
				"node_modules/some-package/index.ts",
				"dist/index.js",
				"src/routes/user.test.ts",
				"src/routes/user.spec.ts",
				"test/integration/api.test.ts",
				"coverage/lcov-report/index.html",
			];

			negativeCases.forEach((file) => {
				expect(validator.shouldScanFile(file)).toBe(false);
			});
		});

		it("should handle edge cases like node_modules_backup", () => {
			// This file matches SCAN_PATTERNS (starts with src/)
			// And it should NOT be excluded because "node_modules_backup" does not match "**/node_modules/**" exclusion
			expect(
				validator.shouldScanFile("src/utilities/node_modules_backup/index.ts"),
			).toBe(true);

			// But actual node_modules should be excluded
			expect(
				validator.shouldScanFile("src/utilities/node_modules/index.ts"),
			).toBe(false);
		});

		it("should handle .test.ts.backup files correctly", () => {
			// .backup files don't match *.ts patterns, so they should be excluded
			expect(validator.shouldScanFile("src/routes/user.test.ts.backup")).toBe(
				false,
			);

			// But a .ts file with test in the name (not ending with .test.ts) should be included
			expect(validator.shouldScanFile("src/routes/user_test_helper.ts")).toBe(
				true,
			);
		});

		it("should handle routes_v2 correctly", () => {
			// routes_v2 doesn't match src/routes/**/*.ts pattern, so it should be false
			// unless we add a specific pattern for it
			expect(validator.shouldScanFile("src/routes_v2/api.ts")).toBe(false);
		});

		it("should exclude allowed files (exemptions)", () => {
			// ALLOWED_PATTERNS - these should be excluded from scanning
			const allowedFiles = [
				"src/utilities/errors/errorHandler.ts",
				"src/fastifyPlugins/errorHandler.ts",
				"setup.ts",
				"config/default.ts",
			];

			allowedFiles.forEach((file) => {
				expect(validator.shouldScanFile(file)).toBe(false);
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

		it("should recognize proper handling patterns", () => {
			const properCases = [
				`catch (e) { throw e; }`,
				`catch (e) { console.error(e); }`,
				`catch (e) { logger.error(e); }`,
				`catch (e) { return null; }`,
				`catch (e) { process.exit(1); }`,
				`catch (e) { throw new TalawaGraphQLError(e); }`,
				`catch (e) { result = { error: e }; }`,
				`catch (e) { currentClient = { isAuthenticated: false }; }`,
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
				"generic_error_in_route_resolver",
				line,
				expect.any(String),
			);
		});

		it("should report generic errors in GraphQL resolvers", () => {
			const line = 'throw Error("Generic error");';

			validator.addViolation = vi.fn();
			validator.checkGenericError("src/graphql/types/User/user.ts", 10, line);

			expect(validator.addViolation).toHaveBeenCalledWith(
				"src/graphql/types/User/user.ts",
				10,
				"generic_error_in_route_resolver",
				line,
				expect.any(String),
			);
		});

		it("should not report generic errors in non-route/resolver files", () => {
			const line = 'throw new Error("Generic error");';
			validator.addViolation = vi.fn();
			validator.checkGenericError("src/utilities/helper.ts", 10, line);

			expect(validator.addViolation).not.toHaveBeenCalled();
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
				throw new Error("Git not found");
			});

			// Mock glob to return some files
			const globMock = await import("glob");
			vi.mocked(globMock.glob).mockResolvedValue(["src/routes/found.ts"]);

			const files = await validator.getFilesToScan();
			expect(files).toContain("src/routes/found.ts");
		});

		it("should use CI logic when GITHUB_BASE_REF is set", async () => {
			const originalEnv = process.env;
			process.env = { ...originalEnv, CI: "true", GITHUB_BASE_REF: "main" };

			vi.mocked(child_process.execSync).mockReturnValue(
				"src/routes/changed.ts\n",
			);

			// Mock shouldScanFile to return true for our test file
			const shouldScanFileSpy = vi
				.spyOn(validator, "shouldScanFile")
				.mockReturnValue(true);

			const files = await validator.getFilesToScan();
			expect(files).toContain("src/routes/changed.ts");
			expect(child_process.execSync).toHaveBeenCalledWith(
				expect.stringContaining("git diff --name-only origin/main...HEAD"),
				expect.anything(),
			);

			shouldScanFileSpy.mockRestore();
			process.env = originalEnv;
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
			process.env = { ...originalEnv, CI: "true", GITHUB_BASE_REF: "main" };

			// Mock fetch to fail but diff to succeed
			vi.mocked(child_process.execSync)
				.mockImplementationOnce(() => {
					throw new Error("Fetch failed");
				})
				.mockReturnValueOnce("src/routes/changed.ts\n");

			// Mock shouldScanFile to return true for our test file
			const shouldScanFileSpy = vi
				.spyOn(validator, "shouldScanFile")
				.mockReturnValue(true);

			const files = await validator.getFilesToScan();
			expect(files).toContain("src/routes/changed.ts");

			shouldScanFileSpy.mockRestore();
			process.env = originalEnv;
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
});
