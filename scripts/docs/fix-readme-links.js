import fs from "node:fs";
import path from "node:path";

const docsDir = path.resolve("./docs/docs/auto-docs");

function replaceLinks(dir) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);

		if (fs.lstatSync(filePath).isDirectory()) {
			replaceLinks(filePath);
		} else if (file.endsWith(".md")) {
			let content = fs.readFileSync(filePath, "utf8");

			// Replace any README.md links with root directory ("/")
			content = content.replace(/\[.*?\]\((.*?)README\.md\)/g, () => {
				return "[API Docs](/)"; // Redirect broken links to the root
			});

			fs.writeFileSync(filePath, content, "utf8");
		}
	}
}

replaceLinks(docsDir);
