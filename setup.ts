import { setup } from "scripts/setup/setup";

setup().catch((err) => {
	console.error(`Setup failed: ${err.message}`);
	console.error("Error details:", {
		type: err.name,
		code: err.code,
		stack: err.stack,
	});
	process.exit(1);
});
