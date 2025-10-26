import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Fixing drizzle schema links in generated docs...");

function findMarkdownFiles(dir) {
	const files = [];

	function walk(directory) {
		const entries = fs.readdirSync(directory, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.isFile() && entry.name.endsWith(".md")) {
				files.push(fullPath);
			}
		}
	}

	walk(dir);
	return files;
}
const docsDir = path.join(__dirname, "../../docs/docs/docs/auto-schema");
const files = findMarkdownFiles(docsDir);

let fixedCount = 0;

for (const file of files) {
	let content = fs.readFileSync(file, "utf8");
	const originalContent = content;

	content = content.replace(
		/\[([^\]]+)\]\((\.\.\/)+drizzle\/schema\/README\.md\)/g,
		"`$1`",
	);

	if (content !== originalContent) {
		fs.writeFileSync(file, content, "utf8");
		fixedCount++;
	}
}

console.log(`✅ Fixed ${fixedCount} files with broken drizzle schema links`);
