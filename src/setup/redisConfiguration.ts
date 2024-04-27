import inquirer from "inquirer";
import * as redis from "redis";

// Check connection to Redis with the specified URL.
/**
 * The function `checkRedisConnection` checks if a connection to Redis can be established using the
 * provided URL.
 * @param url - The `url` parameter is a string that represents the URL of the Redis server.
 * It is used to establish a connection to the Redis server.
 * @returns a Promise that resolves to a boolean value.
 */
export async function checkRedisConnection(url: string): Promise<boolean> {
  let response = false;
  const client = redis.createClient({ url });

  console.log("\nChecking Redis connection....");

  try {
    await client.connect();
    response = true;
  } catch (error) {
    console.log(`\nConnection to Redis failed. Please try again.\n`);
  } finally {
    client.quit();
  }
  return response;
}

// Redis url prompt
/**
 * The function `askForRedisUrl` prompts the user to enter the Redis hostname, port, and password, and
 * returns an object with these values.
 * @returns The function `askForRedisUrl` returns a promise that resolves to an object with the
 * properties `host`, `port`, and `password`.
 */
export async function askForRedisUrl(): Promise<{
  host: string;
  port: number;
  password: string;
}> {
  const { host, port, password } = await inquirer.prompt([
    {
      type: "input",
      name: "host",
      message: "Enter Redis hostname (default: localhost):",
      default: "localhost",
    },
    {
      type: "input",
      name: "port",
      message: "Enter Redis port (default: 6379):",
      default: 6379,
    },
    {
      type: "password",
      name: "password",
      message:
        "Enter Redis password (optional : Leave empty for local connections) :",
    },
  ]);

  return { host, port, password };
}

//check existing redis url
/**
 * The function `checkExistingRedis` checks if there is an existing Redis connection by iterating
 * through a list of Redis URLs and testing the connection.
 * @returns The function `checkExistingRedis` returns a Promise that resolves to a string or null.
 */
export async function checkExistingRedis(): Promise<string | null> {
  const existingRedisURL = ["redis://localhost:6379"];

  for (const url of existingRedisURL) {
    if (!url) {
      continue;
    }

    const isConnected = await checkRedisConnection(url);
    if (isConnected) {
      return url;
    }
  }

  return null;
}
