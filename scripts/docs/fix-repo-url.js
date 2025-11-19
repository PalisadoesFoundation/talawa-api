import fs from "node:fs";
import path from "node:path";

const docsDir = path.resolve("./docs/docs/auto-docs");
const mainRepoUrl =
	"https://github.com/PalisadoesFoundation/talawa-api/tree/main";

function replaceRepoUrl(dir) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);

		if (fs.lstatSync(filePath).isDirectory()) {
			replaceRepoUrl(filePath);
		} else if (file.endsWith(".md")) {
			let content = fs.readFileSync(filePath, "utf8");

			// Replace any repository URL before the "src" directory with the main repository URL
			content = content.replace(
				/https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\//g,
				mainRepoUrl,
			);

			fs.writeFileSync(filePath, content, "utf8");
		}
	}
}

replaceRepoUrl(docsDir);
