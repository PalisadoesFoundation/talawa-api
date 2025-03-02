import fs from "node:fs";
import path from "node:path";

const docsDir = path.resolve(
	process.env.DOCS_DIR || "./docs/docs/docs/auto-schema",
);

const debug = process.env.DEBUG === "true";
//test
function replaceLinks(dir) {
	try {
		const files = fs.readdirSync(dir);
		if (!Array.isArray(files)) {
			console.error("Please enter a valid directory path");
			return;
		}
		if (debug) {
			console.log(
				JSON.stringify({
					level: "info",
					message: "Processing directory",
					directory: dir,
				}),
			);
		}
		for (const file of files) {
			const filePath = path.join(dir, file);
			const stats = fs.lstatSync(filePath);
			if (stats.isDirectory() && !stats.isSymbolicLink()) {
				replaceLinks(filePath);
			} else if (file.endsWith(".md")) {
				let content = fs.readFileSync(filePath, "utf8");
				console.log(`Processing file: ${filePath}`);
				// Replace any README.md links with root directory ("/")
				content = content.replace(
					/\[([^\]]+)\]\((?:\.\.\/|\/)*README\.md(?:#[^\)]+)?\)/gi,
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
		throw err;
	}
}

replaceLinks(docsDir);

export default replaceLinks;
