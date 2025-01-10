import inquirer from "inquirer";
import { isValidEmail } from "./isValidEmail";

/**
 * LAST_RESORT_SUPERADMIN_EMAIL prompt
 * The function `askForSuperAdminEmail` asks the user to enter an email address and returns it as a promise.
 * @returns The email entered by the user is being returned.
 */
export async function askForSuperAdminEmail(): Promise<string> {
  console.log(
    "\nPlease make sure to register with this email before logging in.\n",
  );
  const { email } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message:
        "Enter the email which you wish to assign as the Super Admin of last resort :",
      validate: (input: string): boolean | string =>
        isValidEmail(input) || "Invalid email. Please try again.",
    },
  ]);

  return email;
}
