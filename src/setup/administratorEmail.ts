import inquirer from "inquirer";

/**
 * ADMINISTRATOR_EMAIL prompt
 * The function `askForAdministratorEmail` asks the user to enter an email address and returns it as a promise.
 * @returns The email entered by the user is being returned.
 */
export async function askForAdministratorEmail(): Promise<string> {
  console.log(
    "\nPlease make sure to register with this email before logging in.\n",
  );
  const { email } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message:
        "Enter email :",
    },
  ]);

  return email;
}