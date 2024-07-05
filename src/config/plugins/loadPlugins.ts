import { Plugin } from "../../models";
import _ from "lodash";
import pluginData from "./pluginData.json";
import { logger } from "../../libraries";
import mongoose from "mongoose";

/**
 * Loads plugin data into the MongoDB database if it is not already present.
 *
 * This function connects to the MongoDB database using the connection URL specified in the environment variables.
 * It checks if the plugin data already exists in the database. If the data does not exist, it inserts the data from
 * the provided JSON file (`pluginData.json`). If the data is already present, it logs a message indicating so.
 *
 * @example
 * ```typescript
 * import loadPlugins from './path/to/loadPlugins';
 *
 * loadPlugins().then(() => {
 *   console.log('Plugins loaded successfully.');
 * }).catch(error => {
 *   console.error('Error loading plugins:', error);
 * });
 * ```
 * @see Parent File:
 * - `src/index.ts`
 *
 * @returns  A promise that resolves when the plugins have been loaded or confirms that they are already present.
 *
 */

const loadPlugins = async (): Promise<void> => {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(process.env.MONGO_DB_URL as string);
    logger.info("\x1b[1m\x1b[32m%s\x1b[0m", `Connected to the database`);

    // Fetch existing plugins from the database
    const res = await Plugin.find();
    const databaseTitle = mongoose.connection.db.databaseName;

    if (_.isEmpty(res)) {
      // No previous data, so insert new plugin data from JSON file
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pluginData.forEach(async (plugin: any) => {
        await Plugin.create(plugin);
      });
      logger.info(
        "\x1b[1m\x1b[32m%s\x1b[0m",
        `Uploaded Plugins in ${databaseTitle}`,
      );
    } else {
      // Plugin data is already present in the database
      logger.info(
        "\x1b[1m\x1b[32m%s\x1b[0m",
        `Plugin data already present at ${databaseTitle}`,
      );
    }
  } catch (error) {
    // Log any errors that occur during the process
    logger.error(error);
  }
};

export default loadPlugins;
