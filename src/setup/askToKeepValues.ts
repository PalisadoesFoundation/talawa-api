import inquirer from "inquirer";
/**
 * Function to ask if the user wants to keep the entered values
 * The function `askToKeepValues` prompts the user with a confirmation message and returns a boolean
 * indicating whether the user wants to keep the entered key.
 * @returns a boolean value, either true or false.
 */
export async function askToKeepValues(): Promise<boolean> {
  const { keepValues } = await inquirer.prompt({
    type: "confirm",
    name: "keepValues",
    message: `Would you like to keep the entered key? `,
    default: true,
  });
  return keepValues;
}
