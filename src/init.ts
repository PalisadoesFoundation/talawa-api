import closeWithGrace from "close-with-grace";
import fastify from "./fastify";

/**
 * This function is used to initialize/start the fastify server.
 */
const init = async (): Promise<void> => {
  try {
    /**
     * Makes sure that the server exits gracefully without pending tasks and memory leaks.
     */
    closeWithGrace(async ({ err, signal }) => {
      if (err !== undefined) {
        fastify.log.info(
          { err },
          `Error encountered, shutting down the server.`,
        );
      } else if (signal !== undefined) {
        fastify.log.info(
          `Signal \`${signal}\` received, shutting down the server.`,
        );
      } else {
        fastify.log.info(`Shutting down the server.`);
      }

      await fastify.close();
    });

    await fastify.listen({
      host: fastify.env.HOST,
      port: fastify.env.PORT,
    });

    /**
     * Prints all routes available on the fastify server.
     */
    fastify.log.info(fastify.printRoutes());
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

init();
