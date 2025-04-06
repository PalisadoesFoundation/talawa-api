// THIS SCRIPT IS MEANT FOR GENERATING THE TALAWA API GRAPHQL SCHEMA IN THE GRAPHQL SDL(SCHEMA DEFINITION LANGUAGE) FORMAT AT THE ROOT DIRECTORY OF THIS PROJECT IN A FILE NAMED `schema.graphql`.

import { writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lexicographicSortSchema, printSchema } from "graphql";
import { schema } from "~/src/graphql/schema";

try {
	console.log("Generating the talawa api graphql schema.");
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	await writeFile(
		`${__dirname}/../schema.graphql`,
		printSchema(lexicographicSortSchema(schema)),
	);
	console.log("Successfully generated the talawa api graphql schema.");
} catch (error) {
	console.log(
		"Failed to generate the talawa api graphql schema. Following error encountered: ",
		error,
	);
	process.exit(1);
}
