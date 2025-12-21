import fs from "node:fs";
import path from "node:path";

const docsDir = path.resolve("./docs/docs/auto-docs");

function processText(text) {
	// Split into fenced code block chunks. Keep the fences so we can skip them.
	const fenceSplit = text.split(/(^```[\s\S]*?```$)/m);

	for (let i = 0; i < fenceSplit.length; i++) {
		const chunk = fenceSplit[i];
		// If it's a fenced code block (starts with ```), leave it as-is.
		if (chunk.startsWith("```")) continue;

		const inlineSplit = chunk.split(/(`[^`]*`)/g);

		for (let j = 0; j < inlineSplit.length; j++) {
			const part = inlineSplit[j];
			if (part.startsWith("`")) continue;

			// Replace generics like Identifier<Inner,...> appearing in normal text.
			inlineSplit[j] = part.replace(
				/(?<![`&lt;])\b([A-Za-z0-9_.\])-]+)\s*<([^<>`]+)>/g,
				(m, pre, inner) => {
					if (m.includes("&lt;") || m.includes("&gt;")) return m;
					// Wrap the whole thing in backticks. Use a template literal to satisfy biome/linters.
					return `\`${pre}<${inner}>\``;
				},
			);
		}

		fenceSplit[i] = inlineSplit.join("");
	}

	return fenceSplit.join("");
}

function processFile(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	const newContent = processText(content);
	if (content !== newContent) {
		fs.writeFileSync(filePath, newContent, "utf8");
	}
}

function walk(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const e of entries) {
		const fp = path.join(dir, e.name);
		if (e.isDirectory()) walk(fp);
		else if (e.isFile() && (fp.endsWith(".md") || fp.endsWith(".mdx")))
			processFile(fp);
	}
}

if (!fs.existsSync(docsDir)) {
	console.error("docs dir not found:", docsDir);
	process.exit(1);
}

walk(docsDir);
