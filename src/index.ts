import closeWithGrace from "close-with-grace";
import { createServer } from "./createServer";

// Enhanced error handlers
process.on('uncaughtException', (error) => {
  if (error.name === 'TransformError') {
    console.error('GraphQL Schema Transform Error:', {
      message: error.message,
      stack: error.stack,
      details: error.toString()
    });
    process.exit(1);
  }
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Talawa api server instance with enhanced error handling
const server = await createServer().catch(error => {
  if (error.message?.includes('<<')) {
    console.error('Syntax error detected in GraphQL schema:', error.message);
    console.error('Please check for invalid characters like "<<" in your GraphQL type definitions');
  }
  console.error('Failed to create server:', error);
  process.exit(1);
});

// Basic Redis setup
if (!server.hasDecorator("redis")) {
  try {
    const fastifyRedis = await import('@fastify/redis');
    await server.register(fastifyRedis.default, {
      url: `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
      closeClient: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 5000,
      retry_strategy: function(options) {
        if (options.total_retry_time > 1000 * 15) {
          server.log.error('Redis retry time exhausted');
          return new Error('Redis retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Basic connection monitoring
    server.redis.on('connect', () => {
      server.log.info('Redis connected');
    });

    server.redis.on('error', (err) => {
      server.log.error('Redis error:', err);
    });
  } catch (error) {
    server.log.error('Redis initialization failed:', error);
    process.exit(1);
  }
}

try {
  await server.ready();
  server.log.info('Server initialization completed successfully');
} catch (err) {
  server.log.error({
    err,
    stack: err.stack,
    message: err.message
  }, 'Server initialization failed');
  process.exit(1);
}

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
});

server.listen(
	{
		host: server.envConfig.API_HOST,
		port: server.envConfig.API_PORT,
	},
	(error) => {
		if (error) {
			server.log.error({
				error,
				stack: error.stack,
				message: error.message
			}, "Error encountered while starting the server");
			process.exit(1);
		}
		server.log.info(`Server is running on ${server.envConfig.API_HOST}:${server.envConfig.API_PORT}`);
	},
);