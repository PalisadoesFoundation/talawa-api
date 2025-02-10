import fs from "node:fs";
import path from "node:path";

const docsDir = path.resolve(
	process.env.DOCS_DIR || "./docs/docs/docs/auto-schema",
);

function replaceLinks(dir) {
	try {
		const files = fs.readdirSync(dir);
		console.log(`Processing directory: ${dir}`);
		for (const file of files) {
			const filePath = path.join(dir, file);
			if (fs.lstatSync(filePath).isDirectory()) {
				replaceLinks(filePath);
			} else if (file.endsWith(".md")) {
				let content = fs.readFileSync(filePath, "utf8");
				console.log(`Processing file: ${filePath}`);
				// Replace any README.md links with root directory ("/")
				content = content.replace(
					/\[([^\]]+)\]\((?:\.\.\/)*README\.md\)/g,
					(match, linkText) => {
						console.log(`Replacing README.md link in ${filePath}`);
						return "[Admin Docs](/)"; // Preserve original link text if needed
					},
				);

				fs.writeFileSync(filePath, content, "utf8");
			}
		}
	} catch (err) {
		console.error(`Error processing directory ${dir}:`, err);
		process.exit(1);
	}
}

replaceLinks(docsDir);

export default replaceLinks;
