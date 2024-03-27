import mongodb from "mongodb";
import { exec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

function abort(): void {
  console.log("\nSetup process aborted. 🫠");
  process.exit(1);
}

//Import sample data
/**
 * The function `importDefaultOrganization` will import the default organization
 * with wiping of existing data.
 * @returns The function returns a Promise that resolves to `void`.
 */
export async function importDefaultOrganization(): Promise<void> {
  if (!process.env.MONGO_DB_URL) {
    console.log("Couldn't find mongodb url");
    return;
  }

  const client = new mongodb.MongoClient(process.env.MONGO_DB_URL);

  try {
    await client.connect();
    const db = client.db();

    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      console.log("Collections exist, skipping import.");
    } else {
      const { stdout, stderr } = await exec(
        "npm run import:sample-data-defaultOrg",
      );
      if (stderr) {
        console.error(`Error: ${stderr}`);
        abort();
      }
      console.log(`Output: ${stdout}`);
    }
  } catch (error) {
    console.error("Error importing default Organization:", error);
  } finally {
    await client.close();
  }
}
