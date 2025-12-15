import * as fs from "node:fs/promises";
import * as path from "node:path";
import { glob } from "glob";
import ts from "typescript";

async function checkSanitization() {
	const cwd = process.cwd();
	const files = await glob("src/graphql/types/**/*.ts", { cwd });

	console.log(`Scanning ${files.length} files for sanitization compliance...`);

	let hasErrors = false;

	for (const file of files) {
		const filePath = path.join(cwd, file);
		const content = await fs.readFile(filePath, "utf-8");

		// Check for disable comment
		if (content.includes("// check-sanitization-disable")) {
			continue;
		}

		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);

		let hasStringResolver = false;
		let hasEscapeHTMLImport = false;
		let hasEscapeHTMLUsage = false;
		const resolverBodies: ts.Node[] = [];

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
								if (element.name.text === "escapeHTML") {
									hasEscapeHTMLImport = true;
								}
							}
						}
					}
				}
			}
		});

		// Helper to check if a node is a call to escapeHTML
		function isEscapeHTMLCall(node: ts.Node): boolean {
			if (ts.isCallExpression(node)) {
				const expr = node.expression;
				// Direct call: escapeHTML(...)
				if (ts.isIdentifier(expr) && expr.text === "escapeHTML") {
					return true;
				}
				// Namespace call: sanitizer.escapeHTML(...)
				if (
					ts.isPropertyAccessExpression(expr) &&
					expr.name.text === "escapeHTML"
				) {
					return true;
				}
			}
			return false;
		}

		// Helper to walk a node tree looking for escapeHTML calls
		function hasEscapeHTMLCallInTree(node: ts.Node): boolean {
			if (isEscapeHTMLCall(node)) {
				return true;
			}
			let found = false;
			ts.forEachChild(node, (child) => {
				if (hasEscapeHTMLCallInTree(child)) {
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

				// NOTE: t.exposeString(...) is NOT flagged because it's a direct
				// passthrough of database fields without a custom resolver.
				// Only files with explicit `resolve` functions returning strings
				// are required to use escapeHTML.

				// Check for t.expose(..., { type: 'String' })
				if (
					ts.isPropertyAccessExpression(node.expression) &&
					node.expression.name.text === "expose" &&
					node.arguments.length > 1
				) {
					const secondArg = node.arguments[1];
					if (secondArg && ts.isObjectLiteralExpression(secondArg)) {
						const properties = secondArg.properties;
						for (const prop of properties) {
							if (
								ts.isPropertyAssignment(prop) &&
								prop.name.getText() === "type" &&
								ts.isStringLiteral(prop.initializer) &&
								prop.initializer.text === "String"
							) {
								// t.expose with type String but no resolver is not flagged
								// (similar to exposeString)
							}
						}
					}
				}
			}
			ts.forEachChild(node, visit);
		}

		visit(sourceFile);

		// Check if escapeHTML is actually used in resolver bodies
		if (hasEscapeHTMLImport && resolverBodies.length > 0) {
			for (const body of resolverBodies) {
				if (hasEscapeHTMLCallInTree(body)) {
					hasEscapeHTMLUsage = true;
					break;
				}
			}
		}

		// Determine if the file is safe
		const isSafe = hasEscapeHTMLImport && hasEscapeHTMLUsage;

		if (hasStringResolver && !isSafe) {
			console.error(
				`\n[ERROR] Potential unsafe string resolver found in: ${file}`,
			);
			if (!hasEscapeHTMLImport) {
				console.error(
					"  Reason: The file defines a string resolver but does not import 'escapeHTML'.",
				);
			} else if (!hasEscapeHTMLUsage) {
				console.error(
					"  Reason: The file imports 'escapeHTML' but does not use it in any resolver.",
				);
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
		process.exit(1);
	} else {
		console.log("\nSanitization check passed.");
	}
}

checkSanitization().catch((err) => {
	console.error(err);
	process.exit(1);
});
