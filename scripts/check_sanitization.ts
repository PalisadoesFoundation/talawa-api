/**
 * String Sanitization Compliance Checker for GraphQL Resolvers
 *
 * This script enforces XSS-safe string handling in GraphQL type resolvers by performing
 * static analysis on TypeScript files in src/graphql/types/**.
 *
 * PURPOSE:
 * Ensures all string-returning GraphQL resolvers use escapeHTML() to sanitize user-generated
 * content before returning it, preventing Cross-Site Scripting (XSS) vulnerabilities.
 *
 * WHAT IT CHECKS:
 * - Detects string resolvers created via:
 *   • t.string({ resolve: ... })
 *   • t.field({ type: "String", resolve: ... })
 * - Verifies that each resolver imports escapeHTML from ~/src/utilities/sanitizer
 * - Confirms that ALL string resolvers in a file use escapeHTML (not just some)
 * - Supports direct imports, aliased imports, and namespace imports
 *
 * TRIGGERS AN ERROR IF:
 * - A string resolver exists without importing escapeHTML
 * - escapeHTML is imported but not used in ALL string resolvers
 * - One or more resolvers in a file don't sanitize their output
 *
 * SUPPRESSING WARNINGS:
 * Add `// check-sanitization-disable` at the top of a file to skip validation.
 * Use this ONLY for trusted content (e.g., system-generated tokens, URLs, enums).
 *
 * USAGE:
 * Run manually: pnpm tsx scripts/check_sanitization.ts
 * Automated:   Runs in CI pipeline via lint:sanitization npm script
 *
 * EXIT CODES:
 * 0 - All files pass sanitization checks
 * 1 - One or more files have unsafe string resolvers
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { glob } from "glob";
import ts from "typescript";

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

export function validateFileContent(
	fileName: string,
	content: string,
): ValidationResult {
	const errors: string[] = [];

	// Check for disable comment
	if (content.includes("// check-sanitization-disable")) {
		return { isValid: true, errors: [] };
	}

	const sourceFile = ts.createSourceFile(
		fileName,
		content,
		ts.ScriptTarget.Latest,
		true,
	);

	let hasStringResolver = false;
	let hasEscapeHTMLImport = false;
	const resolverBodies: ts.Node[] = [];
	const namespaceIdentifiers: string[] = [];
	const aliasedIdentifiers: string[] = [];
	const functionDeclarations = new Map<string, ts.Node>();

	// First pass: collect all function/const declarations
	ts.forEachChild(sourceFile, (node) => {
		// Collect function declarations: function myResolver() { ... }
		if (ts.isFunctionDeclaration(node) && node.name) {
			functionDeclarations.set(node.name.text, node.body || node);
		}
		// Collect arrow function const declarations: const myResolver = () => { ... }
		if (ts.isVariableStatement(node)) {
			for (const declaration of node.declarationList.declarations) {
				if (
					ts.isVariableDeclaration(declaration) &&
					ts.isIdentifier(declaration.name) &&
					declaration.initializer
				) {
					functionDeclarations.set(
						declaration.name.text,
						declaration.initializer,
					);
				}
			}
		}
	});

	// Check imports
	ts.forEachChild(sourceFile, (node) => {
		if (ts.isImportDeclaration(node)) {
			const moduleSpecifier = node.moduleSpecifier;
			if (
				ts.isStringLiteral(moduleSpecifier) &&
				(moduleSpecifier.text === "~/src/utilities/sanitizer" ||
					moduleSpecifier.text.endsWith("/utilities/sanitizer"))
			) {
				if (node.importClause?.namedBindings) {
					if (ts.isNamedImports(node.importClause.namedBindings)) {
						for (const element of node.importClause.namedBindings.elements) {
							// Check original name (handles both direct and aliased imports)
							// For: import { escapeHTML } -> element.name.text === "escapeHTML", propertyName is undefined
							// For: import { escapeHTML as escape } -> element.propertyName.text === "escapeHTML", element.name.text === "escape"
							const originalName =
								element.propertyName?.text || element.name.text;
							if (originalName === "escapeHTML") {
								hasEscapeHTMLImport = true;
								// Store the local identifier (could be aliased)
								aliasedIdentifiers.push(element.name.text);
							}
						}
					} else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
						// import * as sanitizer ...
						hasEscapeHTMLImport = true;
						namespaceIdentifiers.push(
							node.importClause.namedBindings.name.text,
						);
					}
				}
			}
		}
	});

	// Helper to check if a node is a call to escapeHTML
	function isEscapeHTMLCall(node: ts.Node): boolean {
		if (ts.isCallExpression(node)) {
			const expr = node.expression;
			// Direct call: escapeHTML(...) or aliased call: escape(...)
			if (ts.isIdentifier(expr)) {
				// Check if it matches "escapeHTML" or any aliased identifier
				if (
					expr.text === "escapeHTML" ||
					aliasedIdentifiers.includes(expr.text)
				) {
					return true;
				}
			}
			// Namespace call: sanitizer.escapeHTML(...)
			if (
				ts.isPropertyAccessExpression(expr) &&
				expr.name.text === "escapeHTML"
			) {
				// Verify the namespace identifier matches an imported one
				if (ts.isIdentifier(expr.expression)) {
					if (namespaceIdentifiers.includes(expr.expression.text)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	// Helper to resolve identifier references to their function declarations
	function resolveNode(node: ts.Node): ts.Node {
		// If the node is an identifier reference, try to resolve it
		if (ts.isIdentifier(node)) {
			const resolved = functionDeclarations.get(node.text);
			if (resolved) {
				return resolved;
			}
		}
		return node;
	}

	// Helper to walk a node tree looking for escapeHTML calls
	function hasEscapeHTMLCallInTree(
		node: ts.Node,
		visited: Set<ts.Node> = new Set(),
	): boolean {
		// Prevent infinite recursion by checking if we've already visited this node
		if (visited.has(node)) {
			return false;
		}
		visited.add(node);

		// First resolve the node in case it's an identifier reference
		const resolvedNode = resolveNode(node);

		// Mark the resolved node as visited too (if different from original)
		if (resolvedNode !== node) {
			if (visited.has(resolvedNode)) {
				return false;
			}
			visited.add(resolvedNode);
		}

		if (isEscapeHTMLCall(resolvedNode)) {
			return true;
		}
		let found = false;
		ts.forEachChild(resolvedNode, (child) => {
			if (hasEscapeHTMLCallInTree(child, visited)) {
				found = true;
			}
		});
		return found;
	}

	// Check for string resolvers and collect resolver bodies
	function visit(node: ts.Node) {
		if (ts.isCallExpression(node)) {
			// Check for t.string({...})
			if (
				ts.isPropertyAccessExpression(node.expression) &&
				node.expression.name.text === "string" &&
				node.arguments.length > 0 &&
				node.arguments[0] &&
				ts.isObjectLiteralExpression(node.arguments[0])
			) {
				const properties = node.arguments[0].properties;
				for (const prop of properties) {
					if (
						ts.isPropertyAssignment(prop) &&
						prop.name.getText() === "resolve"
					) {
						hasStringResolver = true;
						resolverBodies.push(prop.initializer);
					}
				}
			}

			// Check for t.field({ type: "String", ... })
			if (
				ts.isPropertyAccessExpression(node.expression) &&
				node.expression.name.text === "field" &&
				node.arguments.length > 0 &&
				node.arguments[0] &&
				ts.isObjectLiteralExpression(node.arguments[0])
			) {
				const properties = node.arguments[0].properties;
				let isStringType = false;
				let resolverNode: ts.Node | null = null;

				for (const prop of properties) {
					if (ts.isPropertyAssignment(prop)) {
						const name = prop.name.getText();
						if (name === "type") {
							if (
								ts.isStringLiteral(prop.initializer) &&
								prop.initializer.text === "String"
							) {
								isStringType = true;
							}
						}
						if (name === "resolve") {
							resolverNode = prop.initializer;
						}
					}
				}

				if (isStringType && resolverNode) {
					hasStringResolver = true;
					resolverBodies.push(resolverNode);
				}
			}

			// Check for t.expose(..., { type: 'String' })
			// Not flagged if no resolver
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	// Check if escapeHTML is actually used in EACH resolver body
	const unsanitizedResolverCount = resolverBodies.filter(
		(body) => !hasEscapeHTMLCallInTree(body),
	).length;

	// All resolvers must use escapeHTML for the file to be safe
	const allResolversUseSanitization =
		hasEscapeHTMLImport &&
		resolverBodies.length > 0 &&
		unsanitizedResolverCount === 0;

	// Determine if the file is safe
	const isSafe = hasEscapeHTMLImport && allResolversUseSanitization;

	if (hasStringResolver && !isSafe) {
		if (!hasEscapeHTMLImport) {
			errors.push(
				`The file defines ${resolverBodies.length} string resolver(s) but does not import 'escapeHTML'.`,
			);
		} else if (unsanitizedResolverCount > 0) {
			errors.push(
				`The file has ${unsanitizedResolverCount} of ${resolverBodies.length} string resolver(s) missing escapeHTML sanitization.`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export async function checkSanitization(): Promise<boolean> {
	try {
		const cwd = process.cwd();
		const files = await glob("src/graphql/types/**/*.ts", { cwd });

		console.log(
			`Scanning ${files.length} files for sanitization compliance...`,
		);

		let hasErrors = false;

		for (const file of files) {
			const filePath = path.join(cwd, file);
			const content = await fs.readFile(filePath, "utf-8");

			const result = validateFileContent(file, content);

			if (!result.isValid) {
				console.error(
					`\n[ERROR] Potential unsafe string resolver found in: ${file}`,
				);
				for (const error of result.errors) {
					console.error(`  Reason: ${error}`);
				}
				console.error(
					"  Fix: Import 'escapeHTML' from '~/src/utilities/sanitizer' and use it to sanitize user-generated content.",
				);
				console.error(
					"  If this is trusted content (e.g. system tokens), add '// check-sanitization-disable' to the file.",
				);
				hasErrors = true;
			}
		}

		if (hasErrors) {
			console.error("\nSanitization check failed.");
			return false;
		}

		console.log("\nSanitization check passed.");
		return true;
	} catch (error) {
		console.error("Error during sanitization check:", error);
		return false;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	checkSanitization()
		.then((success) => {
			if (!success) {
				process.exit(1);
			}
		})
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}
