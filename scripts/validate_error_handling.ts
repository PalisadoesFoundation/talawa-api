#!/usr/bin/env tsx

/**
 * Error Handling Compliance Checker
 *
 * Enforces unified error handling patterns:
 * - Detects generic Error usage in REST routes and GraphQL resolvers
 * - Validates proper error propagation in catch blocks
 * - Ensures TalawaRestError/TalawaGraphQLError usage
 * - Enforces structured logging in critical paths
 *
 * SUPPRESSING WARNINGS:
 * Add `// validate-error-handling-disable` at file top
 *
 * EXIT CODES:
 * 0 - All files pass
 * 1 - Violations found
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Paths to ENFORCE structured logging (reject console.*)
const ENFORCE_STRUCTURED_LOGGING = [
	"src/routes/**",
	"src/graphql/types/**",
	"src/workers/**",
];

// Paths to EXEMPT (allow console.*)
const ALLOW_CONSOLE_USAGE = [
	"src/plugin/**", // Plugin system
	"scripts/**", // Validation tools
	"test/**", // Test files
];

// Configuration
const SCAN_PATTERNS = [
	"src/routes/**/*.ts",
	"src/graphql/types/**/*.ts",
	"src/graphql/resolvers/**/*.ts",
	"src/REST/**/*.ts",
	"src/utilities/**/*.ts",
	"src/workers/**/*.ts",
	"src/plugin/**/*.ts",
	"scripts/**/*.ts",
];

const EXCLUDE_PATTERNS = [
	"**/node_modules/**",
	"**/dist/**",
	"**/*.test.ts",
	"**/*.spec.ts",
	"**/test/**",
	"**/coverage/**",
];

// Allowed patterns (exceptions to the rules)
const ALLOWED_PATTERNS = [
	// Allow Error in error transformation/handling utilities
	/src\/utilities\/errors\//,
	// Allow Error in error handler plugins
	/src\/fastifyPlugins\/errorHandler/,
	// Allow Error in setup/configuration files
	/setup\.ts$/,
	/config/i,
];

const WARN_ONLY_MODE = false;

interface Violation {
	filePath: string;
	lineNumber: number;
	violationType: string;
	line: string;
	suggestion: string;
}

interface ValidationResult {
	violations: Violation[];
	fileCount: number;
	violationCount: number;
	suppressedFiles: string[];
}

class ErrorHandlingValidator {
	public result: ValidationResult = {
		violations: [],
		fileCount: 0,
		violationCount: 0,
		suppressedFiles: [],
	};

	async validate(): Promise<number> {
		console.log("Validating error handling standards...\n");

		try {
			const files = await this.getFilesToScan();
			if (files.length === 0) {
				console.log("No relevant modified files found to scan.");
				return 0;
			}

			console.log(
				`Scanning ${files.length} files for error handling violations...\n`,
			);

			for (const filePath of files) {
				await this.validateFile(filePath);
				this.result.fileCount++;
			}

			this.printResults();

			// Warn-only mode check
			if (WARN_ONLY_MODE) {
				console.log(
					"\nCurrently running in WARN-ONLY mode. Violations will not block CI.",
				);
				return 0;
			}

			return this.result.violations.length > 0 ? 1 : 0;
		} catch (error) {
			console.error("Error during validation:", (error as Error).message);
			return 1;
		}
	}

	private async getFilesToScan(): Promise<string[]> {
		// Try to get modified files first (Infinite incremental mode)
		try {
			const modifiedFiles = this.getModifiedFiles();
			if (modifiedFiles.length > 0) {
				// Filter modified files to only those that match our scan scope
				return modifiedFiles.filter((file) => this.shouldScanFile(file));
			}

			if (process.env.CI || process.env.GITHUB_BASE_REF) {
				console.log(
					"No modified files detected in CI context. Falling back to full scan pattern check.",
				);
			} else {
				console.log("No modified files detected. Skipping validation.");
				return [];
			}
		} catch (_error) {
			console.warn(
				"Could not determine modified files, falling back to full scan pattern check.",
			);
		}

		// If git diff fails during an incremental scan, fall back to a full scan (e.g., fresh CI without history)
		// and log the fallback for safety despite the user's request.
		const allFiles: string[] = [];

		for (const pattern of SCAN_PATTERNS) {
			const files = await glob(pattern, {
				cwd: rootDir,
				ignore: EXCLUDE_PATTERNS,
				absolute: false,
			});
			allFiles.push(...files);
		}

		const uniqueFiles = [...new Set(allFiles)];
		return uniqueFiles.filter((file) => !this.isAllowedFile(file));
	}

	private getModifiedFiles(): string[] {
		const isCI = process.env.CI || process.env.GITHUB_BASE_REF;

		if (isCI) {
			try {
				const baseRef = process.env.GITHUB_BASE_REF || "develop";
				// Fetch is necessary in some CI environments (like shallow clones)
				try {
					execSync(`git fetch origin ${baseRef}`, {
						cwd: rootDir,
						stdio: "ignore",
					});
				} catch {
					// Ignore fetch errors, might already have refs
				}

				const diffCommand = `git diff --name-only origin/${baseRef}...HEAD`;
				return execSync(diffCommand, {
					cwd: rootDir,
					encoding: "utf8",
					stdio: ["pipe", "pipe", "ignore"],
				})
					.split("\n")
					.filter(Boolean)
					.map((f) => f.trim());
			} catch (error) {
				console.warn(
					`CI git diff failed: ${(error as Error).message}. Returning empty list to trigger fallback.`,
				);
				return [];
			}
		}

		try {
			// Unstaged changes
			const unstaged = execSync("git diff --name-only", {
				cwd: rootDir,
				encoding: "utf8",
				stdio: ["pipe", "pipe", "ignore"],
			})
				.split("\n")
				.filter(Boolean);

			// Staged changes
			const staged = execSync("git diff --name-only --cached", {
				cwd: rootDir,
				encoding: "utf8",
				stdio: ["pipe", "pipe", "ignore"],
			})
				.split("\n")
				.filter(Boolean);

			// Clean and unique
			return [...new Set([...unstaged, ...staged])].map((f) => f.trim());
		} catch (_e) {
			throw new Error("Git command failed");
		}
	}

	private shouldScanFile(filePath: string): boolean {
		// Quick check if file matches any scan pattern root
		// This is a simplified check. For strict correctness ideally use minimatch against SCAN_PATTERNS
		// But checking prefix is roughly enough for the given patterns.
		if (EXCLUDE_PATTERNS.some((p) => filePath.includes(p.replace(/\*\*/g, ""))))
			return false;

		// Check if allowed (generic error exemptions) - we still scan them for console usage though?
		// logic below uses isAllowedFile to filter out generally ignored files.
		if (this.isAllowedFile(filePath)) return false;

		return SCAN_PATTERNS.some((pattern) => {
			const cleanPattern = pattern.replace(/\*\*.*$/, "").replace("**", "");
			return filePath.startsWith(cleanPattern);
		});
	}

	private isAllowedFile(filePath: string): boolean {
		return ALLOWED_PATTERNS.some((pattern) => pattern.test(filePath));
	}

	private async validateFile(filePath: string): Promise<void> {
		const fullPath = join(rootDir, filePath);

		if (!existsSync(fullPath)) {
			return;
		}

		try {
			const content = readFileSync(fullPath, "utf8");
			const lines = content.split("\n");

			if (this.isFileSuppressed(content)) {
				this.result.suppressedFiles.push(filePath);
				return;
			}

			lines.forEach((line, index) => {
				const lineNumber = index + 1;
				this.checkLineForViolations(filePath, lineNumber, line);
			});
		} catch (error) {
			console.warn(
				`Could not read file ${filePath}: ${(error as Error).message}`,
			);
		}
	}

	private isFileSuppressed(content: string): boolean {
		const firstLines = content.split("\n").slice(0, 10).join("\n");
		return firstLines.includes("// validate-error-handling-disable");
	}

	private checkLineForViolations(
		filePath: string,
		lineNumber: number,
		line: string,
	): void {
		const trimmedLine = line.trim();
		if (
			trimmedLine.startsWith("//") ||
			trimmedLine.startsWith("*") ||
			trimmedLine.startsWith("/*")
		) {
			return;
		}

		// Checks for generic Error usage in routes and resolvers
		this.checkGenericError(filePath, lineNumber, line);

		// Checks for empty catch blocks
		// Known limitation: multiline empty catch blocks won't be detected by this regex.
		if (/catch\s*\([^)]*\)\s*\{\s*\}/g.test(line)) {
			this.addViolation(
				filePath,
				lineNumber,
				"empty_catch_block",
				line,
				"Add proper error handling or logging in catch block",
			);
		}

		// Checks for console usage enforcement
		this.checkConsoleUsage(filePath, lineNumber, line);

		// Checks for catch blocks without proper error handling
		this.checkCatchHandling(filePath, lineNumber, line);
	}

	private checkGenericError(
		filePath: string,
		lineNumber: number,
		line: string,
	): void {
		if (this.isRouteOrResolverFile(filePath)) {
			if (
				/throw\s+new\s+Error\s*\(/g.test(line) ||
				/throw\s+Error\s*\(/g.test(line)
			) {
				this.addViolation(
					filePath,
					lineNumber,
					"generic_error_in_route_resolver",
					line,
					this.getGenericErrorSuggestion(filePath),
				);
			}
		}
	}

	private checkConsoleUsage(
		filePath: string,
		lineNumber: number,
		line: string,
	): void {
		// Check explicit exemption
		if (this.matchesPattern(filePath, ALLOW_CONSOLE_USAGE)) {
			return;
		}

		// Check strict enforcement
		if (this.matchesPattern(filePath, ENFORCE_STRUCTURED_LOGGING)) {
			if (/console\.(log|error|warn|info|debug)\s*\(/.test(line)) {
				this.addViolation(
					filePath,
					lineNumber,
					"console_usage_enforced",
					line,
					"Structured logging is enforced here. Use request.log/ctx.log instead of console.*",
				);
			}
		} else {
			// Default behavior: Reject console.error only
			if (/console\.error\s*\(/g.test(line)) {
				this.addViolation(
					filePath,
					lineNumber,
					"console_error_usage",
					line,
					"Use structured logging (request.log.error) instead of console.error",
				);
			}
		}
	}

	private checkCatchHandling(
		filePath: string,
		lineNumber: number,
		line: string,
	): void {
		if (/catch\s*\([^)]*\)\s*\{[^}]*\}/g.test(line)) {
			const catchContent = line.match(/catch\s*\([^)]*\)\s*\{([^}]*)\}/)?.[1];
			if (
				catchContent &&
				!catchContent.includes("throw") &&
				!catchContent.includes("log") &&
				!catchContent.includes("error") &&
				catchContent.trim().length > 0
			) {
				this.addViolation(
					filePath,
					lineNumber,
					"improper_catch_handling",
					line,
					"Catch blocks should re-throw errors or use proper error logging",
				);
			}
		}
	}

	private matchesPattern(filePath: string, patterns: string[]): boolean {
		return patterns.some((p) => {
			const prefix = p.replace("/**", "");
			return filePath.startsWith(prefix);
		});
	}

	private isRouteOrResolverFile(filePath: string): boolean {
		return (
			filePath.includes("src/routes/") ||
			filePath.includes("src/graphql/types/") ||
			filePath.includes("src/graphql/resolvers/") ||
			filePath.includes("src/REST/")
		);
	}

	private getGenericErrorSuggestion(filePath: string): string {
		if (filePath.includes("graphql") || filePath.includes("resolver")) {
			return "Use TalawaGraphQLError with appropriate ErrorCode instead of generic Error";
		}
		if (
			filePath.includes("route") ||
			filePath.includes("REST") ||
			filePath.includes("fastify")
		) {
			return "Use TalawaRestError with appropriate ErrorCode instead of generic Error";
		}
		return "Use TalawaRestError or TalawaGraphQLError with appropriate ErrorCode instead of generic Error";
	}

	private addViolation(
		filePath: string,
		lineNumber: number,
		violationType: string,
		line: string,
		suggestion: string,
	): void {
		this.result.violations.push({
			filePath,
			lineNumber,
			violationType,
			line: line.trim(),
			suggestion,
		});
		this.result.violationCount++;
	}

	private printResults(): void {
		if (this.result.suppressedFiles.length > 0) {
			console.log(`Suppressed files: ${this.result.suppressedFiles.length}`);
			this.result.suppressedFiles.forEach((file) => {
				console.log(`   ${file} (suppressed)`);
			});
			console.log("");
		}

		if (this.result.violations.length === 0) {
			console.log("No error handling violations found!");
			if (this.result.fileCount > 0) {
				console.log(`Scanned ${this.result.fileCount} files`);
			}
			return;
		}

		console.log(`VIOLATIONS Error handling issues found:\n`);

		const violationsByType = this.result.violations.reduce(
			(acc, violation) => {
				const key = violation.violationType;
				if (!acc[key]) {
					acc[key] = [];
				}
				acc[key].push(violation);
				return acc;
			},
			{} as Record<string, Violation[]>,
		);

		Object.entries(violationsByType).forEach(([type, violations]) => {
			console.log(
				`${this.getViolationTitle(type)} (${violations.length} issues):`,
			);

			violations.forEach((violation) => {
				console.log(`   ${violation.filePath}:${violation.lineNumber}`);
				console.log(`   ${violation.line}`);
				console.log(`   ${violation.suggestion}\n`);
			});
		});

		console.log(
			`Summary: ${this.result.violationCount} issues in ${this.result.fileCount} files`,
		);
	}

	private getViolationTitle(type: string): string {
		const titles: Record<string, string> = {
			generic_error_in_route_resolver:
				"Generic Error Usage in Routes/Resolvers",
			empty_catch_block: "Empty Catch Blocks",
			console_error_usage: "Console Error Usage",
			console_usage_enforced: "Structured Logging Enforced (Console Usage)",
			improper_catch_handling: "Improper Catch Block Handling",
		};
		return titles[type] || type;
	}
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const fixMode = args.includes("--fix");

	if (fixMode) {
		console.log("Running error handling validation with auto-fix...\n");

		// First, run validation to identify files with violations
		const validator = new ErrorHandlingValidator();
		const exitCode = await validator.validate();

		if (exitCode === 0) {
			console.log("No violations found. Nothing to fix.");
			return;
		}

		// Get files with violations
		const filesWithViolations = [
			...new Set(validator.result.violations.map((v) => v.filePath)),
		];

		if (filesWithViolations.length > 0) {
			console.log(
				`\n🔧 Applying Biome formatting to ${filesWithViolations.length} files with violations...\n`,
			);

			try {
				// Apply biome formatting only to files with violations
				const fileList = filesWithViolations.join(" ");
				execSync(`npx biome check --write ${fileList}`, {
					stdio: "inherit",
					cwd: rootDir,
				});

				console.log("\nBiome formatting applied to files with violations.");
				console.log(
					"\n💡 Note: Some error handling issues require manual fixes.",
				);
				console.log(
					"   Run 'pnpm run validate:error-handling' to see remaining issues.",
				);
			} catch (error) {
				console.error("Error applying Biome formatting:", error);
				process.exit(1);
			}
		}
	} else {
		const validator = new ErrorHandlingValidator();
		const exitCode = await validator.validate();
		process.exit(exitCode);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("Unexpected error:", error);
		process.exit(1);
	});
}
