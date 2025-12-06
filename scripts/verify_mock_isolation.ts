import { readFileSync } from "node:fs";
import { globSync } from "glob";
import ts from "typescript";

const TEST_FILES_GLOB = "test/**/*.{test,spec}.ts";

function checkFile(filePath: string): boolean {
    const content = readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

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
                ["clearAllMocks", "restoreAllMocks", "resetAllMocks", "resetModules"].includes(n.expression.name.text)
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
    if (!checkFile(file)) {
        console.error(`❌ Missing mock cleanup in: ${file}`);
        errors++;
    }
}

if (errors > 0) {
    console.log(`\n⚠️  Found ${errors} files with missing mock isolation.`);
    console.log(
        "Please add the following to your test file:\n" +
        'afterEach(() => {\n  vi.clearAllMocks();\n});'
    );
    // Intentionally exiting with 0 to warn only, as per PR strategy
    process.exit(0);
} else {
    console.log("\n✅ All checked test files have proper mock isolation.");
    process.exit(0);
}
