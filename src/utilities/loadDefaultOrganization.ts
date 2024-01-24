import mongoose from "mongoose";
import path from "path";
import { Organization } from "../models";
import fs from "fs";
import dotenv from "dotenv";
import yargs from "yargs";
import { InterfaceArgs, formatDatabase } from "./loadSampleData";

dotenv.config();
/**
 * The function which loads the default organization, so that there is always altleast 1 organization in the DB
 * @returns a Promise that resolves to void
 */

export async function loadDefaultOrganization(): Promise<void> {
  let session!: mongoose.ClientSession;
  const url = process.env.MONGO_DB_URL;
  if (url == null) {
    console.log("Couldn't find mongodb url");
    return;
  }
  await mongoose.connect(url, {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useNewUrlParser: true,
  });
  const { format } = yargs
    .options({
      items: {
        alias: "i",
        describe:
          "Comma-separated list of collections to load sample data into",
        type: "string",
      },
      format: {
        alias: "f",
        describe:
          "Formats all the collections present in the database before the insertion of objects. [WARNING] Use carefully.",
        type: "boolean",
      },
    })
    .parseSync() as InterfaceArgs;

  // Check if specific collections need to be inserted
  if (format) {
    await formatDatabase();
  }
  session = await mongoose.startSession();
  const data = await fs.readFileSync(
    path.join(__dirname, `../../sample_data/defaultOrganization.json`),
    "utf8"
  );
  const docs = JSON.parse(data) as Record<string, unknown>[];
  await Organization.insertMany(docs);
  console.log("Default Organization loaded");
  session?.endSession();
  await mongoose.connection.close();
}

loadDefaultOrganization();
