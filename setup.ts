import { setup } from "scripts/setup/setup";

setup().catch((err) => {
	if (err instanceof Error && err.name === "ExitPromptError") {
		console.error("Setup interrupted by user.");
	} else {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`Setup failed: ${message}`);
	}
	process.exit(1);
});
