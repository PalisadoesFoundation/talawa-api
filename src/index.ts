import "./tracing";
import closeWithGrace from "close-with-grace";
import { createServer } from "./createServer";
import { shutdownTracing } from "./observability/tracing/bootstrap";
import { warmOrganizations } from "./services/caching/warming";

// Talawa api server instance.
const server = await createServer();

// Makes sure that the server is ready to start listening for requests.
await server.ready();

// Set a timeout warning for cache warming
const WARMING_TIMEOUT_MS = 10000; // 10 seconds
const warmingTimeout = setTimeout(() => {
	server.log.warn(
		"Cache warming is taking longer than expected (> 10 seconds).",
	);
}, WARMING_TIMEOUT_MS);
warmingTimeout.unref(); // unref so it doesn't hold the process open

// Warm the organization cache in the background.
warmOrganizations(server)
	.catch((err) => {
		server.log.error({ err }, "Background cache warming failed unexpectedly.");
	})
	.finally(() => {
		clearTimeout(warmingTimeout);
	});

// Makes sure that the server exits gracefully without pending tasks and memory leaks.
closeWithGrace(async ({ err, signal }) => {
	if (err !== undefined) {
		server.log.info(
			{
				err,
			},
			"Error encountered, gracefully shutting down the server.",
		);
	} else if (signal !== undefined) {
		server.log.info(
			`Signal '${signal}' received, gracefully shutting down the server.`,
		);
	} else {
		server.log.info("Gracefully shutting down the server.");
	}

	// Triggers `onClose` handlers within all fastify plugin functions.
	await server.close();
	await shutdownTracing();
});

server.listen(
	{
		host: server.envConfig.API_HOST,
		port: server.envConfig.API_PORT,
	},
	(error) => {
		if (error) {
			server.log.error(
				{ error },
				"Error encountered while starting the server.",
			);
			process.exit(1);
		}
	},
);
