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

		// Check imports
		ts.forEachChild(sourceFile, (node) => {
			if (ts.isImportDeclaration(node)) {
				const moduleSpecifier = node.moduleSpecifier;
				if (
					ts.isStringLiteral(moduleSpecifier) &&
					(moduleSpecifier.text.includes("/sanitizer") ||
						moduleSpecifier.text.includes("sanitizer"))
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

		// Check for string resolvers
		function visit(node: ts.Node) {
			if (ts.isCallExpression(node)) {
				// Check for t.string({...})
				if (
					ts.isPropertyAccessExpression(node.expression) &&
					node.expression.name.text === "string" && // Matches .string
					// Heuristic: check if 't' or 'builder' or similar is the expression?
					// Usually it's t.string
					// But we should just check if it has a 'resolve' property in the options object.
					node.arguments.length > 0 &&
					node.arguments[0] &&
					ts.isObjectLiteralExpression(node.arguments[0])
				) {
					const properties = node.arguments[0].properties;
					const hasResolve = properties.some(
						(prop) =>
							ts.isPropertyAssignment(prop) &&
							prop.name.getText() === "resolve",
					);
					if (hasResolve) {
						hasStringResolver = true;
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
					let hasResolve = false;

					for (const prop of properties) {
						if (ts.isPropertyAssignment(prop)) {
							const name = prop.name.getText();
							if (name === "type") {
								// Check if type is "String"
								if (
									ts.isStringLiteral(prop.initializer) &&
									prop.initializer.text === "String"
								) {
									isStringType = true;
								}
							}
							if (name === "resolve") {
								hasResolve = true;
							}
						}
					}

					if (isStringType && hasResolve) {
						hasStringResolver = true;
					}
				}

				// Check for t.exposeString(...)
				if (
					ts.isPropertyAccessExpression(node.expression) &&
					node.expression.name.text === "exposeString"
				) {
					hasStringResolver = true;
				}

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
								hasStringResolver = true;
							}
						}
					}
				}
			}
			ts.forEachChild(node, visit);
		}

		visit(sourceFile);

		if (hasStringResolver && !hasEscapeHTMLImport) {
			console.error(
				`\n[ERROR] Potential unsafe string resolver found in: ${file}`,
			);
			console.error(
				"  Reason: The file defines a string resolver but does not import 'escapeHTML'.",
			);
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
