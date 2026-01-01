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

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Paths to ENFORCE structured logging (reject console.*)
export const ENFORCE_STRUCTURED_LOGGING = [
	"src/routes/**",
	"src/graphql/types/**",
	"src/workers/**",
];

// Paths to EXEMPT (allow console.*)
export const ALLOW_CONSOLE_USAGE = [
	"src/plugin/**", // Plugin system
	"scripts/**", // Validation tools
	"test/**", // Test files
];

// Configuration
export const SCAN_PATTERNS = [
	"src/routes/**/*.ts",
	"src/graphql/types/**/*.ts",
	"src/graphql/resolvers/**/*.ts",
	"src/REST/**/*.ts",
	"src/utilities/**/*.ts",
	"src/workers/**/*.ts",
	"src/plugin/**/*.ts",
	"scripts/**/*.ts",
];

export const EXCLUDE_PATTERNS = [
	"**/node_modules/**",
	"**/dist/**",
	"**/*.test.ts",
	"**/*.spec.ts",
	"**/test/**",
	"**/coverage/**",
];

// Allowed patterns (exceptions to the rules)
export const ALLOWED_PATTERNS = [
	// Allow Error in error transformation/handling utilities
	/src\/utilities\/errors\//,
	// Allow Error in error handler plugins
	/src\/fastifyPlugins\/errorHandler/,
	// Allow Error in setup/configuration files
	/setup\.ts$/,
	/config/i,
];

const WARN_ONLY_MODE = false;

// Number of lines to check for suppression comment at the start of a file
export const SUPPRESSION_CHECK_LINES = 10;

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

export class ErrorHandlingValidator {
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
			const errorMessage =
				error instanceof Error
					? error.message
					: typeof error === "string"
						? error
						: JSON.stringify(error) || String(error);
			console.error("Error during validation:", errorMessage);
			return 1;
		}
	}

	public async getFilesToScan(): Promise<string[]> {
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

	public getModifiedFiles(): string[] {
		const isCI = process.env.CI || process.env.GITHUB_BASE_REF;

		if (isCI) {
			try {
				const baseRef = this.sanitizeGitRef(
					process.env.GITHUB_BASE_REF || "develop",
				);
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
				const errorMessage =
					error instanceof Error
						? error.message
						: typeof error === "string"
							? error
							: JSON.stringify(error) || String(error);
				console.warn(
					`CI git diff failed: ${errorMessage}. Returning empty list to trigger fallback.`,
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

	public branchExists(branch: string): boolean {
		try {
			const sanitizedBranch = this.sanitizeGitRef(branch);
			execSync(`git rev-parse --verify ${sanitizedBranch}`, {
				cwd: rootDir,
				stdio: "ignore",
			});
			return true;
		} catch {
			return false;
		}
	}

	public sanitizeGitRef(ref: string): string {
		// Allow only safe characters for git references
		// Git refs can contain: alphanumeric, -, _, /, .
		if (!/^[a-zA-Z0-9_\-/.]+$/.test(ref)) {
			throw new Error(`Invalid git reference: ${ref}`);
		}

		// Prevent command injection patterns
		if (
			ref.includes(";") ||
			ref.includes("|") ||
			ref.includes("&") ||
			ref.includes("$") ||
			ref.includes("`") ||
			ref.includes("(") ||
			ref.includes(")") ||
			ref.includes("<") ||
			ref.includes(">")
		) {
			throw new Error(`Invalid git reference: ${ref}`);
		}

		return ref;
	}

	public matchesGlobPattern(filePath: string, pattern: string): boolean {
		// Normalize path to posix style
		const normalizedPath = filePath.replace(/\\/g, "/");
		const normalizedPattern = pattern.replace(/\\/g, "/");

		// Handle simple cases first
		if (normalizedPattern === normalizedPath) return true;
		if (!normalizedPattern.includes("*") && !normalizedPattern.includes("?")) {
			return normalizedPath === normalizedPattern;
		}

		// Special case: pattern like "src/routes/**/*.ts" should match "src/routes/user.ts"
		// This means ** can match zero directories
		if (normalizedPattern.includes("**/")) {
			// Try matching with ** as zero directories
			const zeroMatch = normalizedPattern.replace(/\*\*\//, "");
			if (this.matchesSimpleGlob(normalizedPath, zeroMatch)) {
				return true;
			}
		}

		return this.matchesSimpleGlob(normalizedPath, normalizedPattern);
	}

	private matchesSimpleGlob(filePath: string, pattern: string): boolean {
		// Convert glob pattern to regex
		let regexPattern = pattern
			.replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars except * and ?
			.replace(/\*\*/g, "___DOUBLESTAR___") // Temporarily replace **
			.replace(/\*/g, "[^/]*") // * matches anything except directory separator
			.replace(/\?/g, "[^/]") // ? matches single character except directory separator
			.replace(/___DOUBLESTAR___/g, ".*"); // ** matches any number of directories

		// Anchor the pattern
		regexPattern = `^${regexPattern}$`;

		// Limit glob pattern complexity to prevent backtracking
		// Prevent ReDoS attacks on dynamically constructed regex patterns
		// Patterns are hardcoded, but this safeguard protects against future changes
		if (
			regexPattern.length > 500 ||
			(regexPattern.match(/\*/g) || []).length > 10
		) {
			console.warn(`Pattern too complex, using string fallback: ${pattern}`);
			const simplePattern = pattern.replace(/\*+/g, "");
			return filePath.includes(simplePattern);
		}

		try {
			const regex = new RegExp(regexPattern);
			return regex.test(filePath);
		} catch {
			// Fallback to simple string matching if regex fails
			const simplePattern = pattern.replace(/\*+/g, "");
			return filePath.includes(simplePattern);
		}
	}

	public shouldScanFile(filePath: string): boolean {
		// Normalize path to posix style for consistent matching
		const normalizedPath = filePath.replace(/\\/g, "/");

		// Check exclusion patterns first - return false if any match
		for (const pattern of EXCLUDE_PATTERNS) {
			if (this.matchesGlobPattern(normalizedPath, pattern)) {
				return false;
			}
		}

		// Check if allowed (generic error exemptions)
		if (this.isAllowedFile(normalizedPath)) return false;

		// Check scan patterns - return true if any match
		for (const pattern of SCAN_PATTERNS) {
			if (this.matchesGlobPattern(normalizedPath, pattern)) {
				return true;
			}
		}

		return false;
	}

	public isAllowedFile(filePath: string): boolean {
		return ALLOWED_PATTERNS.some((pattern) => pattern.test(filePath));
	}

	public async validateFile(filePath: string): Promise<void> {
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

			// Process multiline catch blocks first
			this.checkMultilineCatchBlocks(filePath, content, lines);

			lines.forEach((line, index) => {
				const lineNumber = index + 1;
				this.checkLineForViolations(filePath, lineNumber, line);
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: typeof error === "string"
						? error
						: JSON.stringify(error) || String(error);
			console.warn(`Could not read file ${filePath}: ${errorMessage}`);
		}
	}

	public checkMultilineCatchBlocks(
		filePath: string,
		content: string,
		lines: string[],
	): void {
		// Remove comments and strings to avoid false positives
		const cleanContent = this.removeCommentsAndStrings(content);

		// Find all catch blocks using a state machine approach
		const catchBlocks = this.findCatchBlocks(cleanContent);

		for (const catchBlock of catchBlocks) {
			const lineNumber = this.getLineNumberFromPosition(
				content,
				catchBlock.start,
			);

			// Check for empty catch blocks
			if (catchBlock.isEmpty) {
				// Get the actual line content for reporting
				const reportLine = this.getLineContent(lines, lineNumber);
				this.addViolation(
					filePath,
					lineNumber,
					"empty_catch_block",
					reportLine,
					"Add proper error handling or logging in catch block",
				);
			}
			// Check for improper catch handling
			else if (catchBlock.hasImproperHandling) {
				const reportLine = this.getLineContent(lines, lineNumber);
				this.addViolation(
					filePath,
					lineNumber,
					"improper_catch_handling",
					reportLine,
					"Catch blocks should re-throw errors or use proper error logging",
				);
			}
		}
	}

	public removeCommentsAndStrings(content: string): string {
		// Replace single-line comments with spaces
		let cleaned = content.replace(/\/\/.*$/gm, (match) =>
			" ".repeat(match.length),
		);

		// Replace multi-line comments with spaces (preserving newlines)
		cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, (match) =>
			match.replace(/[^\n]/g, " "),
		);

		// Replace string literals with spaces (preserving newlines)
		cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
			match.replace(/[^\n]/g, " "),
		);
		cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, (match) =>
			match.replace(/[^\n]/g, " "),
		);
		cleaned = cleaned.replace(/`(?:[^`\\]|\\.)*`/g, (match) =>
			match.replace(/[^\n]/g, " "),
		);

		return cleaned;
	}

	public findCatchBlocks(content: string): Array<{
		start: number;
		end: number;
		body: string;
		isEmpty: boolean;
		hasImproperHandling: boolean;
	}> {
		const catchBlocks: Array<{
			start: number;
			end: number;
			body: string;
			isEmpty: boolean;
			hasImproperHandling: boolean;
		}> = [];

		// Find catch statements using regex
		const catchRegex = /catch\s*\([^)]*\)\s*\{/g;
		let match = catchRegex.exec(content);
		while (match !== null) {
			const catchStart = match.index;
			const openBraceIndex = catchStart + match[0].length - 1;

			// Find the matching closing brace
			const closeBraceIndex = this.findMatchingBrace(content, openBraceIndex);

			if (closeBraceIndex !== -1) {
				const body = content.slice(openBraceIndex + 1, closeBraceIndex);

				// Check if empty (including comment-only blocks)
				const bodyWithoutComments = body
					.replace(/\/\/.*$/gm, "") // Remove single-line comments
					.replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
					.trim();
				const isEmpty = bodyWithoutComments.length === 0;

				// Check for improper handling (has content but no proper error handling)
				const hasImproperHandling =
					!isEmpty && !this.hasProperErrorHandling(body);

				catchBlocks.push({
					start: catchStart,
					end: closeBraceIndex + 1,
					body,
					isEmpty,
					hasImproperHandling,
				});
			}

			match = catchRegex.exec(content);
		}

		return catchBlocks;
	}

	public findMatchingBrace(content: string, openBraceIndex: number): number {
		let braceCount = 1;
		let index = openBraceIndex + 1;

		while (index < content.length && braceCount > 0) {
			const char = content[index];
			if (char === "{") {
				braceCount++;
			} else if (char === "}") {
				braceCount--;
			}
			index++;
		}

		return braceCount === 0 ? index - 1 : -1;
	}

	public hasProperErrorHandling(catchBody: string): boolean {
		// Check for proper error handling patterns
		const properHandlingPatterns = [
			/throw\s+/, // Re-throwing errors
			/\.log\s*\(/, // Logging methods
			/\.error\s*\(/, // Error logging
			/\.warn\s*\(/, // Warning logging
			/\.info\s*\(/, // Info logging
			/\.debug\s*\(/, // Debug logging
			/console\s*\.\s*log/, // Console logging (though not preferred)
			/console\s*\.\s*error/, // Console error
			/console\s*\.\s*warn/, // Console warn
			/logger\s*\./, // Logger usage
			/log\s*\(/, // Generic log function calls
			/return\s+/, // Early returns (sometimes valid)
			/process\s*\.\s*exit/, // Process exit (sometimes valid)
			/TalawaGraphQLError/, // Custom error types
			/TalawaRestError/, // Custom error types
			/=\s*\{[^}]*error/, // Assignment operations that include error handling
			/\w+\s*=\s*[^;]*error/, // Variable assignments that involve error
			/currentClient\s*=/, // Specific pattern for authentication fallback
			/result\s*=/, // Result assignment pattern
			/addIssue\s*\(/, // Zod error handling
			/reject\w*\s*\(/, // Promise rejection handling
		];

		// Also check if the catch body has meaningful code (not just comments)
		const meaningfulCode = catchBody
			.replace(/\/\/.*$/gm, "") // Remove single-line comments
			.replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
			.trim();

		// If there's meaningful code, check if it matches proper handling patterns
		if (meaningfulCode.length > 0) {
			return properHandlingPatterns.some((pattern) => pattern.test(catchBody));
		}

		return false;
	}

	public getLineNumberFromPosition(content: string, position: number): number {
		const beforePosition = content.slice(0, position);
		return beforePosition.split("\n").length;
	}

	public getLineContent(lines: string[], lineNumber: number): string {
		// For reporting, show the catch statement line
		const line = lines[lineNumber - 1] || "";

		// If it's a single line catch block, return the line
		if (line.includes("catch") && line.includes("{") && line.includes("}")) {
			return line;
		}

		// For multiline blocks, return the catch declaration line
		if (line.includes("catch")) {
			return line;
		}

		// Fallback: find the line with 'catch'
		for (
			let i = Math.max(0, lineNumber - 3);
			i < Math.min(lines.length, lineNumber + 3);
			i++
		) {
			const currentLine = lines[i];
			if (currentLine?.includes("catch")) {
				return currentLine;
			}
		}

		return line;
	}

	public isFileSuppressed(content: string): boolean {
		const firstLines = content
			.split("\n")
			.slice(0, SUPPRESSION_CHECK_LINES)
			.join("\n");
		return firstLines.includes("// validate-error-handling-disable");
	}

	public checkLineForViolations(
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

		// Checks for console usage enforcement
		this.checkConsoleUsage(filePath, lineNumber, line);
	}

	public checkGenericError(
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

	public checkConsoleUsage(
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

	public matchesPattern(filePath: string, patterns: string[]): boolean {
		return patterns.some((p) => {
			const prefix = p.replace("/**", "");
			const prefixWithSlash = prefix.endsWith("/") ? prefix : `${prefix}/`;
			return filePath.startsWith(prefixWithSlash);
		});
	}

	public isRouteOrResolverFile(filePath: string): boolean {
		return (
			filePath.includes("src/routes/") ||
			filePath.includes("src/graphql/types/") ||
			filePath.includes("src/graphql/resolvers/") ||
			filePath.includes("src/REST/")
		);
	}

	public getGenericErrorSuggestion(filePath: string): string {
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

	public addViolation(
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

	public printResults(): void {
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

	public getViolationTitle(type: string): string {
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

	public applyFixes(): void {
		const filesWithViolations = [
			...new Set(this.result.violations.map((v) => v.filePath)),
		];

		if (filesWithViolations.length > 0) {
			console.log(
				`\n🔧 Applying Biome formatting to ${filesWithViolations.length} files with violations...\n`,
			);

			try {
				// Validate and normalize file paths to prevent command injection
				const safePaths = filesWithViolations.map((filePath) => {
					// Resolve to absolute path and then make relative to rootDir
					const absolutePath = resolve(rootDir, filePath);
					// Use path.relative for cross-platform compatibility
					const relativePath = relative(rootDir, absolutePath).replace(
						/\\/g,
						"/",
					);

					// Validate path doesn't contain suspicious characters
					if (!/^[a-zA-Z0-9_\-./]+$/.test(relativePath)) {
						throw new Error(`Suspicious file path: ${filePath}`);
					}

					return relativePath;
				});

				// Use execFileSync with args array to prevent shell injection
				execFileSync("npx", ["biome", "check", "--write", ...safePaths], {
					stdio: "inherit",
					cwd: rootDir,
					shell: false, // Explicitly disable shell
				});

				console.log("\nBiome formatting applied to files with violations.");
				console.log(
					"\n💡 Note: Some error handling issues require manual fixes.",
				);
				console.log(
					"   Run 'pnpm run validate:error-handling' to see remaining issues.",
				);
			} catch (error) {
				// Re-throw validation errors, but handle execution errors differently
				if (
					error instanceof Error &&
					error.message.includes("Suspicious file path")
				) {
					throw error;
				}
				console.error("Error applying Biome formatting:", error);
				process.exit(1);
			}
		}
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

		validator.applyFixes();
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
