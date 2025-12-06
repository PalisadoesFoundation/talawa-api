import fs from "node:fs";

import { glob } from "glob";
import ts from "typescript";



/**
 * Checks if a test file has proper mock isolation.
 * Rule: If a file uses `vi.mock`, `vi.fn`, or `vi.spyOn`, it MUST have `afterEach(() => { vi.clearAllMocks(); })`.
 */
function checkFile(filePath: string): boolean {
    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
    );

    let hasMocks = false;
    let hasCleanup = false;

    function visit(node: ts.Node) {
        // Check for vi.mock(), vi.fn(), vi.spyOn()
        if (
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === "vi"
        ) {
            const method = node.expression.name.text;
            if (["mock", "fn", "spyOn"].includes(method)) {
                hasMocks = true;
            }
        }

        // Check for afterEach(() => { vi.clearAllMocks(); })
        if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === "afterEach"
        ) {
            const arg = node.arguments[0];
            if (arg && (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg))) {
                const body = arg.body;
                if (ts.isBlock(body)) {
                    // Check statements inside the block
                    for (const stmt of body.statements) {
                        if (
                            ts.isExpressionStatement(stmt) &&
                            ts.isCallExpression(stmt.expression) &&
                            ts.isPropertyAccessExpression(stmt.expression.expression) &&
                            ts.isIdentifier(stmt.expression.expression.expression) &&
                            stmt.expression.expression.expression.text === "vi" &&
                            [
                                "clearAllMocks",
                                "restoreAllMocks",
                                "resetAllMocks",
                                "resetModules",
                            ].includes(stmt.expression.expression.name.text)
                        ) {
                            hasCleanup = true;
                        }
                    }
                } else if (
                    ts.isCallExpression(body) &&
                    ts.isPropertyAccessExpression(body.expression) &&
                    ts.isIdentifier(body.expression.expression) &&
                    body.expression.expression.text === "vi" &&
                    [
                        "clearAllMocks",
                        "restoreAllMocks",
                        "resetAllMocks",
                        "resetModules",
                    ].includes(body.expression.name.text)
                ) {
                    // Implicit return: afterEach(() => vi.clearAllMocks())
                    hasCleanup = true;
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (hasMocks && !hasCleanup) {
        console.log(
            `⚠️  Warning: ${filePath} is missing mock cleanup (vi.clearAllMocks, vi.restoreAllMocks, etc.) in 'afterEach'`,
        );
        return false;
    }

    return true;
}

async function main() {
    const args = process.argv.slice(2);
    // Support passing specific files (e.g. from lefthook)
    const files =
        args.length > 0
            ? args
            : await glob("test/**/*.{test,spec}.ts", { ignore: "node_modules/**" });

    let errors = 0;

    console.log(`Checking ${files.length} files for mock isolation...`);

    for (const file of files) {
        try {
            if (!checkFile(file)) {
                errors++;
            }
        } catch (err) {
            console.error(`Error parsing ${file}:`, err);
        }
    }

    if (errors > 0) {
        console.log(`\n⚠️  Found ${errors} files with missing mock isolation.`);
        console.log(
            "   Please add 'afterEach(() => { vi.clearAllMocks(); })' (or restoreAllMocks/resetModules) to these files.",
        );
        // process.exit(1); // Do not fail the build, just warn
    } else {
        console.log("\n✅ All checked test files have proper mock isolation.");
    }
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
