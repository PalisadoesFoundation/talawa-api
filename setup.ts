import { setup } from "./src/setup";

setup().catch((err) => {
	console.error("An error occurred during setup:", err);
	process.exit(1);
});
