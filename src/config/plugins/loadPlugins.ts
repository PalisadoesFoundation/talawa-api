import { Plugin } from "../../models";
import _ from "lodash";
import pluginData from "./pluginData.json";
import { logger } from "../../libraries";
// Only loads plugin data for the time if it's not currently present in the database
const loadPlugins = async (): Promise<void> => {
  const res = await Plugin.find();
  let databaseTitle = process.env.MONGO_DB_URL || "";
  databaseTitle = databaseTitle.split("mongodb.net/")[1].split("?")[0];
  if (_.isEmpty(res)) {
    pluginData.forEach(async (plugin: any) => {
      await Plugin.create(plugin);
    });
    logger.info(
      "\x1b[1m\x1b[32m%s\x1b[0m",
      `Uploaded Plugins in ${databaseTitle} `
    );
  } else {
    logger.info(
      "\x1b[1m\x1b[32m%s\x1b[0m",
      `Plugin data already present at ${databaseTitle}`
    );
  }
};

export default loadPlugins;
