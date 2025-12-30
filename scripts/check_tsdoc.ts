/**
 * TSDoc Validation Script
 *
 * This script validates TSDoc comments in TypeScript files using the
 * `@microsoft/tsdoc` library (the same parser used by `eslint-plugin-tsdoc`).
 *
 * ## Why a Custom Script Instead of eslint-plugin-tsdoc?
 *
 * We use a custom script rather than directly using `eslint-plugin-tsdoc` to
 * filter out certain overly pedantic TSDoc rules that would significantly
 * hurt documentation readability without providing meaningful value.
 *
 * Specifically, eslint-plugin-tsdoc reports errors for:
 * - `tsdoc-malformed-inline-tag`: Triggers on `{` in documentation text
 * - `tsdoc-escape-right-brace`: Triggers on `}` in documentation text
 *
 * These rules require escaping all curly braces in documentation. For example,
 * type descriptions like `{id: string}` would need to become `\{id: string\}`.
 * This escaping:
 * 1. Significantly reduces readability of documentation
 * 2. Makes documentation harder to write and maintain
 * 3. Would require changes across all existing documentation
 * 4. Could cause issues in CI during deployment
 *
 * By using a custom script, we get the same TSDoc validation quality while
 * intentionally filtering out these noisy rules that don't improve docs.
 *
 * ## Usage
 *
 *   pnpm lint:tsdoc              # Check all src/**\/*.ts files
 *   pnpm lint:tsdoc file1.ts     # Check specific files
 *
 * ## Exit Codes
 *
 *   0 - All TSDoc comments are valid
 *   1 - TSDoc validation errors found
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
	type ParserMessage,
	TSDocConfiguration,
	TSDocParser,
} from "@microsoft/tsdoc";
import { glob } from "glob";

interface ValidationError {
	filePath: string;
	line: number;
	column: number;
	messageId: string;
	message: string;
}

/**
 * Extracts all JSDoc/TSDoc comment blocks from a TypeScript file.
 * @param content - The file content to parse
 * @returns Array of comment blocks with their line numbers
 */
function extractDocComments(
	content: string,
): Array<{ comment: string; startLine: number; startColumn: number }> {
	const comments: Array<{
		comment: string;
		startLine: number;
		startColumn: number;
	}> = [];

	// Match JSDoc/TSDoc style comments: /** ... */
	const docCommentRegex = /\/\*\*[\s\S]*?\*\//g;

	for (const match of content.matchAll(docCommentRegex)) {
		const beforeMatch = content.substring(0, match.index);
		const lines = beforeMatch.split("\n");
		const startLine = lines.length;
		const lastLine = lines[lines.length - 1];
		const startColumn = (lastLine?.length ?? 0) + 1;

		comments.push({
			comment: match[0],
			startLine,
			startColumn,
		});
	}

	return comments;
}

/**
 * Validates a single TSDoc comment block.
 * @param comment - The comment text including delimiters
 * @param config - TSDoc parser configuration
 * @returns Array of parser messages (errors/warnings)
 */
function validateComment(
	comment: string,
	config: TSDocConfiguration,
): readonly ParserMessage[] {
	const parser = new TSDocParser(config);
	const parserContext = parser.parseString(comment);
	return parserContext.log.messages;
}

/**
 * Validates all TSDoc comments in a file.
 * @param filePath - Path to the TypeScript file
 * @param config - TSDoc parser configuration
 * @returns Array of validation errors
 */
function validateFile(
	filePath: string,
	config: TSDocConfiguration,
): ValidationError[] {
	const errors: ValidationError[] = [];

	try {
		const content = fs.readFileSync(filePath, "utf-8");
		const comments = extractDocComments(content);

		for (const { comment, startLine, startColumn } of comments) {
			const messages = validateComment(comment, config);

			for (const msg of messages) {
				/**
				 * Ignored TSDoc Rules
				 *
				 * We intentionally filter out these rules because they are overly
				 * pedantic and don't improve documentation quality. See the file
				 * header comment for the full rationale.
				 *
				 * - tsdoc-malformed-inline-tag: Triggers on `{` in type examples like `{id: string}`
				 * - tsdoc-escape-right-brace: Triggers on `}` in type examples
				 * - tsdoc-escape-greater-than: Triggers on `>` in arrow function examples
				 * - tsdoc-at-sign-in-word: Triggers on `@` in email examples
				 * - tsdoc-characters-after-block-tag: Triggers on `@example.` patterns
				 *
				 * Fixing these would require escaping characters like `\{`, `\}`, `\>`
				 * throughout all documentation, which hurts readability significantly.
				 */
				const ignoredMessageIds = [
					"tsdoc-malformed-inline-tag",
					"tsdoc-escape-right-brace",
					"tsdoc-escape-greater-than",
					"tsdoc-at-sign-in-word",
					"tsdoc-characters-after-block-tag",
				];

				if (ignoredMessageIds.includes(msg.messageId)) {
					continue;
				}

				// Calculate actual line number within the file
				const commentLines = comment
					.substring(0, msg.textRange.pos)
					.split("\n");
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
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error reading file ${filePath}: ${errorMessage}`);
		throw new Error(`Failed to validate file ${filePath}: ${errorMessage}`);
	}

	return errors;
}

/**
 * Main function to run TSDoc validation.
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);

	// Determine which files to check
	let filesToCheck: string[];

	if (args.length > 0) {
		// Check specific files passed as arguments
		filesToCheck = args.filter(
			(arg) => arg.endsWith(".ts") && !arg.endsWith(".d.ts"),
		);
	} else {
		// Check all TypeScript files in src/
		const srcPath = path.join(process.cwd(), "src");
		filesToCheck = await glob("**/*.ts", {
			cwd: srcPath,
			absolute: true,
			ignore: ["**/*.d.ts", "**/node_modules/**"],
		});
	}

	if (filesToCheck.length === 0) {
		console.log("No TypeScript files to check.");
		process.exit(0);
	}

	// Configure TSDoc parser with standard configuration
	const config = new TSDocConfiguration();

	let totalErrors = 0;
	const allErrors: ValidationError[] = [];

	for (const filePath of filesToCheck) {
		const errors = validateFile(filePath, config);
		if (errors.length > 0) {
			allErrors.push(...errors);
			totalErrors += errors.length;
		}
	}

	// Report errors
	if (allErrors.length > 0) {
		console.error("\nTSDoc validation errors:\n");

		for (const error of allErrors) {
			const relativePath = path.relative(process.cwd(), error.filePath);
			console.error(
				`${relativePath}:${error.line}:${error.column} - error ${error.messageId}: ${error.message}`,
			);
		}

		console.error(
			`\n✖ Found ${totalErrors} TSDoc error(s) in ${filesToCheck.length} file(s)\n`,
		);
		process.exit(1);
	}

	console.log(`✓ TSDoc validation passed for ${filesToCheck.length} file(s)\n`);
	process.exit(0);
}

main().catch((error) => {
	console.error("TSDoc validation failed:", error);
	process.exit(1);
});
