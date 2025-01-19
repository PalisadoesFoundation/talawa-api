import inquirer from "inquirer";
import { MongoClient } from "mongodb";

/**
 * The `checkExistingMongoDB` function checks for an existing MongoDB URL in the environment variables and attempts to establish a connection.
 *
 * It performs the following steps:
 * 1. Retrieves the MongoDB URL from the environment variables.
 * 2. If no URL is found, it immediately returns null.
 * 3. If a URL is found, it attempts to establish a connection using the `checkConnection` function.
 *    - If the connection is successful (i.e., `checkConnection` returns true), it returns the URL.
 *    - If the connection fails (i.e., `checkConnection` returns false), it returns null.
 *
 * This function is used during the initial setup process to check if a valid MongoDB connection can be made with the existing URL in the environment variables.
 * @returns A promise that resolves to a string (if a connection could be made to the existing URL) or null (if no existing URL or connection could not be made).
 */
export async function checkExistingMongoDB(): Promise<string | null> {
  const existingMongoDbUrls = process.env.MONGO_DB_URL;

  if (!existingMongoDbUrls) {
    return null;
  }
  const isConnected = await checkConnection(existingMongoDbUrls);
  if (isConnected) {
    return existingMongoDbUrls;
  } else return null;
}

// Check the connection to MongoDB with the specified URL.
/**
 * The `checkConnection` function attempts to establish a connection to a MongoDB instance using a provided URL.
 *
 * @param url - The MongoDB connection URL.
 * @returns A promise that resolves to a boolean indicating whether the connection was successful (true) or not (false).
 *
 * It performs the following steps:
 * 1. Tries to establish a connection to the MongoDB instance using the provided URL with a server selection timeout of 1000 milliseconds.
 * 2. If the connection is successful, it closes the connection and returns true.
 * 3. If the connection fails, it logs an error message and returns false.
 *    - If the error is an instance of the Error class, it logs the error message.
 *    - If the error is not an instance of the Error class, it logs a generic error message and the error itself.
 *
 * This function is used during the initial setup process to test the MongoDB connection.
 */
export async function checkConnection(url: string): Promise<boolean> {
  console.log("\nChecking MongoDB connection....");

  try {
    const connection = await MongoClient.connect(url, {
      serverSelectionTimeoutMS: 1000,
    });
    await connection.close();
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        `\nConnection to MongoDB failed with error: ${error.message}\n`,
      );
    } else {
      console.log(`\nConnection to MongoDB failed. Please try again.\n`);
      console.log(error);
    }
    return false;
  }
}

//Mongodb url prompt
/**
 * The function `askForMongoDBUrl` prompts the user to enter a MongoDB URL and returns the entered URL
 * as a string.
 * @returns a Promise that resolves to a string.
 */
export async function askForMongoDBUrl(): Promise<string> {
  const { url } = await inquirer.prompt([
    {
      type: "input",
      name: "url",
      message: "Enter your MongoDB URL:",
      default: "mongodb://localhost:27017",
    },
  ]);

  return url;
}
