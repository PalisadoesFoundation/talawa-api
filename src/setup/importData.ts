//Import sample data

import { abort, shouldWipeExistingData } from "../../setup";
import type { ExecException } from "child_process";
import { exec } from "child_process";

/**
 * The function `importData` imports sample data into a MongoDB database if the database URL is provided and if it
 * is determined that existing data should be wiped.
 * @returns The function returns a Promise that resolves to `void`.
 */
export async function importData(): Promise<void> {
  if (!process.env.MONGO_DB_URL) {
    console.log("Couldn't find mongodb url");
    return;
  }
  const shouldImport = await shouldWipeExistingData(process.env.MONGO_DB_URL);

  if (shouldImport) {
    console.log("Importing sample data...");
    await exec(
      "npm run import:sample-data",
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          abort();
        }
        if (stderr) {
          console.error(`Error: ${stderr}`);
          abort();
        }
        console.log(`Output: ${stdout}`);
      },
    );
  }
}
