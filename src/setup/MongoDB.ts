import inquirer from "inquirer";
import mongodb from "mongodb";

/**
 * Function to check if Existing MongoDB instance is running
 * The function `checkExistingMongoDB` checks for an existing MongoDB connection by iterating through a
 * list of URLs and testing the connection using the `checkConnection` function.
 * @returns The function `checkExistingMongoDB` returns a promise that resolves to a string or null.
 */
export async function checkExistingMongoDB(): Promise<string | null> {
  const existingMongoDbUrls = [
    process.env.MONGO_DB_URL,
    "mongodb://localhost:27017",
  ];

  for (const url of existingMongoDbUrls) {
    if (!url) {
      continue;
    }

    const isConnected = await checkConnection(url);
    if (isConnected) {
      return url;
    }
  }

  return null;
}

// Check the connection to MongoDB with the specified URL.
/**
 * The function `checkConnection` is an asynchronous function that checks the connection to a MongoDB
 * database using the provided URL and returns a boolean value indicating whether the connection was
 * successful or not.
 * @param url - The `url` parameter is a string that represents the connection URL for the
 * MongoDB server. It typically includes the protocol (e.g., `mongodb://`), the host and port
 * information, and any authentication credentials if required.
 * @returns a Promise that resolves to a boolean value. The boolean value indicates whether the
 * connection to the MongoDB server was successful (true) or not (false).
 */
export async function checkConnection(url: string): Promise<boolean> {
  console.log("\nChecking MongoDB connection....");

  try {
    const connection = await mongodb.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 1000,
    });
    await connection.close();
    return true;
  } catch (error) {
    console.log(`\nConnection to MongoDB failed. Please try again.\n`);
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
      default: process.env.MONGO_DB_URL,
    },
  ]);

  return url;
}
