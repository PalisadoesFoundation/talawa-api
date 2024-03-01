import inquirer from "inquirer";

/**
 * Get the node environment
 * The function `getNodeEnvironment` is an asynchronous function that prompts the user to select a Node
 * environment (either "development" or "production") and returns the selected environment as a string.
 * @returns a Promise that resolves to a string representing the selected Node environment.
 */
export async function getNodeEnvironment(): Promise<string> {
  const { nodeEnv } = await inquirer.prompt([
    {
      type: "list",
      name: "nodeEnv",
      message: "Select Node environment:",
      choices: ["development", "production"],
      default: "development",
    },
  ]);

  return nodeEnv;
}
