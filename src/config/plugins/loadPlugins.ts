import { Plugin } from "../../models";
import _ from "lodash";
import pluginData from "./pluginData.json";
import { logger } from "../../libraries";
import mongoose from "mongoose";
// Only loads plugin data for the time if it's not currently present in the database
const loadPlugins = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    logger.info("\x1b[1m\x1b[32m%s\x1b[0m", `Connected to the database`);
    const res = await Plugin.find();
    const databaseTitle = mongoose.connection.db.databaseName;
    if (_.isEmpty(res)) {
      //no previous data then update with our new data. (Only happens once)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pluginData.forEach(async (plugin: any) => {
        await Plugin.create(plugin);
      });
      logger.info(
        "\x1b[1m\x1b[32m%s\x1b[0m",
        `Uploaded Plugins in ${databaseTitle} `,
      );
    } else {
      //plugin data already present
      logger.info(
        "\x1b[1m\x1b[32m%s\x1b[0m",
        `Plugin data already present at ${databaseTitle}`,
      );
    }
  } catch (error) {
    logger.error(error);
  }
};

export default loadPlugins;
