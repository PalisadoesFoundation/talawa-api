/**
 * TSDoc Auto-Fix Script
 *
 * Automatically fixes common TSDoc errors:
 * 1. Missing hyphens after @param names
 * 2. @description tags (replace with plain text)
 * 3. Unescaped curly braces in non-inline-tag contexts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "glob";

/**
 * Fixes @param tags missing hyphens.
 * Transforms: @param name Description
 * To: @param name - Description
 */
function fixParamMissingHyphen(content: string): string {
	// Match @param followed by name and description without hyphen
	// Pattern: @param name Description (where name doesn't have hyphen after it)
	return content.replace(/(@param\s+)(\w+)(\s+)(?!-\s)([A-Z])/g, "$1$2 - $4");
}

/**
 * Fixes @returns tags missing hyphens.
 * Transforms: @returns Description
 * To: @returns - Description (if followed by non-hyphen)
 */
function fixReturnsMissingHyphen(content: string): string {
	return content.replace(/(@returns\s+)(?!-\s)([A-Z])/g, "$1- $2");
}

/**
 * Removes @description tags and keeps the text.
 * Transforms: @description Some text
 * To: Some text
 */
function fixDescriptionTag(content: string): string {
	// Remove @description tag but keep the description text
	return content.replace(/@description\s+/g, "");
}

/**
 * Escapes curly braces that are not part of inline tags.
 * Only escapes braces that look like type annotations or simple object literals.
 * Note: This handles simple patterns only; nested braces require manual review.
 */
function fixUnescapedBraces(content: string): string {
	// Find doc comments and fix braces inside them
	return content.replace(/\/\*\*[\s\S]*?\*\//g, (docComment) => {
		// Don't escape if it's already a proper inline tag like {@link} or {@inheritDoc}
		// More comprehensive character class for TypeScript types including:
		// - word characters, pipes, angle brackets, square brackets
		// - colons, parentheses, arrows (=>), question marks, exclamation marks
		// - dots, commas, spaces
		return docComment.replace(
			/\{(?!@)([\w|<>[\],\s.:()=>?!-]+)\}/g,
			"\\{$1\\}",
		);
	});
}

/**
 * Process a single file and fix TSDoc issues.
 */
function fixFile(filePath: string): { fixed: boolean; changes: string[] } {
	const changes: string[] = [];
	let content = fs.readFileSync(filePath, "utf-8");
	const originalContent = content;

	// Apply fixes
	const afterParamFix = fixParamMissingHyphen(content);
	if (afterParamFix !== content) {
		changes.push("Fixed @param missing hyphens");
		content = afterParamFix;
	}

	const afterReturnsFix = fixReturnsMissingHyphen(content);
	if (afterReturnsFix !== content) {
		changes.push("Fixed @returns missing hyphens");
		content = afterReturnsFix;
	}

	const afterDescriptionFix = fixDescriptionTag(content);
	if (afterDescriptionFix !== content) {
		changes.push("Removed @description tags");
		content = afterDescriptionFix;
	}

	const afterBracesFix = fixUnescapedBraces(content);
	if (afterBracesFix !== content) {
		changes.push("Escaped curly braces");
		content = afterBracesFix;
	}

	if (content !== originalContent) {
		fs.writeFileSync(filePath, content, "utf-8");
		return { fixed: true, changes };
	}

	return { fixed: false, changes: [] };
}

async function main(): Promise<void> {
	console.log("TSDoc Auto-Fix Script\n");
	console.log("Finding TypeScript files in src/...\n");

	const srcPath = path.join(process.cwd(), "src");
	const files = await glob("**/*.ts", {
		cwd: srcPath,
		absolute: true,
		ignore: ["**/*.d.ts", "**/node_modules/**"],
	});

	console.log(`Found ${files.length} TypeScript files\n`);

	let totalFixed = 0;
	const fixedFiles: Array<{ path: string; changes: string[] }> = [];

	for (const filePath of files) {
		const result = fixFile(filePath);
		if (result.fixed) {
			totalFixed++;
			fixedFiles.push({
				path: path.relative(process.cwd(), filePath),
				changes: result.changes,
			});
		}
	}

	if (fixedFiles.length > 0) {
		console.log("Fixed files:\n");
		for (const file of fixedFiles) {
			console.log(`  ${file.path}`);
			for (const change of file.changes) {
				console.log(`    - ${change}`);
			}
		}
		console.log(`\n✓ Fixed ${totalFixed} file(s)\n`);
	} else {
		console.log("No files needed fixing.\n");
	}
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
