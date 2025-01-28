import { setup } from "./src/setup";
import { restoreEnvFile } from "./src/setup";

setup().catch((err) => {
	restoreEnvFile();
	console.error("An error occurred during setup:", err);
	process.exit(1);
});
