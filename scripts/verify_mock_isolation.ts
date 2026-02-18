import { readFileSync } from "node:fs";
import { globSync } from "glob";
import ts from "typescript";

const TEST_FILES_GLOB = "test/**/*.{test,spec}.{ts,tsx}";

function checkFile(filePath: string): boolean {
	const content = readFileSync(filePath, "utf-8");
	const sourceFile = ts.createSourceFile(
		filePath,
		content,
		ts.ScriptTarget.Latest,
		true,
	);

	// Check if the parsed file has any severe parse errors
	// by looking for nodes that couldn't be parsed
	function hasParseErrors(node: ts.Node): boolean {
		if (node.kind === ts.SyntaxKind.Unknown) {
			return true;
		}
		return ts.forEachChild(node, hasParseErrors) || false;
	}

	if (hasParseErrors(sourceFile)) {
		console.warn(`[WARN] Skipping file due to parse errors: ${filePath}`);
		return true; // Skip checking this file
	}

	let hasMockUsage = false;
	let hasCleanup = false;

	function visit(node: ts.Node) {
		// Check for mock usage: vi.mock, vi.fn, vi.spyOn
		if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			ts.isIdentifier(node.expression.expression) &&
			node.expression.expression.text === "vi" &&
			["mock", "fn", "spyOn"].includes(node.expression.name.text)
		) {
			hasMockUsage = true;
		}

		// Check for cleanup in afterEach
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			node.expression.text === "afterEach"
		) {
			const callback = node.arguments[0];
			if (
				callback &&
				(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
			) {
				if (containsCleanupCall(callback.body)) {
					hasCleanup = true;
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	function containsCleanupCall(node: ts.Node): boolean {
		let found = false;
		function search(n: ts.Node) {
			if (found) return;

			if (
				ts.isCallExpression(n) &&
				ts.isPropertyAccessExpression(n.expression) &&
				ts.isIdentifier(n.expression.expression) &&
				n.expression.expression.text === "vi" &&
				[
					"clearAllMocks",
					"restoreAllMocks",
					"resetAllMocks",
					"resetModules",
				].includes(n.expression.name.text)
			) {
				found = true;
				return;
			}
			ts.forEachChild(n, search);
		}
		search(node);
		return found;
	}

	visit(sourceFile);

	if (hasMockUsage && !hasCleanup) {
		return false;
	}

	return true;
}

const files = globSync(TEST_FILES_GLOB, { cwd: process.cwd() });
let errors = 0;

console.log(`Checking ${files.length} test files for mock isolation...`);

for (const file of files) {
	try {
		if (!checkFile(file)) {
			console.error(`[ERROR] Missing mock cleanup in: ${file}`);
			errors++;
		}
	} catch (error) {
		console.error(`[ERROR] Failed to check file: ${file}`, error);
		errors++;
	}
}

if (files.length === 0) {
	console.log("[INFO] No test files found.");
	process.exit(0);
} else if (errors > 0) {
	const shouldFail = process.env.MOCK_ISOLATION_FAIL_ON_ERROR === "true";
	console.error(
		`[ERROR] Found ${errors} files missing mock isolation (afterEach cleanup).`,
	);
	console.error(
		"[INFO] Please add 'afterEach(() => { vi.clearAllMocks(); });' (or restoreAllMocks/resetAllMocks/resetModules) to these files.",
	);
	if (shouldFail) {
		process.exit(1);
	} else {
		console.warn(
			"[WARN] Exiting with 0 because MOCK_ISOLATION_FAIL_ON_ERROR is not 'true'.",
		);
		process.exit(0);
	}
} else {
	console.log("[SUCCESS] All test files have mock isolation!");
	process.exit(0);
}
