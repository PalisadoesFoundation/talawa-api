import "./tracing";
import closeWithGrace from "close-with-grace";
import { createServer } from "./createServer";
import { shutdownTracing } from "./observability/tracing/bootstrap";
import { warmOrganizations } from "./services/caching/warming";

// Talawa api server instance.
const server = await createServer();

// Makes sure that the server is ready to start listening for requests.
await server.ready();

// Warm the organization cache.
await warmOrganizations(server);

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
