import inquirer from "inquirer";

/**
 * Prompts the user for text input.
 * @param name - The name/key for the prompt answer
 * @param message - The message to display to the user
 * @param defaultValue - Optional default value
 * @param validate - Optional validation function returning true or an error message
 * @returns The user's input string
 */
export async function promptInput(
	name: string,
	message: string,
	defaultValue?: string,
	validate?: (input: string) => true | string,
): Promise<string> {
	const answers = await inquirer.prompt<Record<string, string>>([
		{ type: "input", name, message, default: defaultValue, validate },
	]);
	const result = answers[name];
	if (typeof result !== "string") {
		throw new Error(`Expected string response for prompt "${name}"`);
	}
	return result;
}

/**
 * Prompts the user to select from a list of choices.
 * @param name - The name/key for the prompt answer
 * @param message - The message to display to the user
 * @param choices - Array of choices to select from
 * @param defaultValue - Optional default selection
 * @returns The selected choice
 */
export async function promptList(
	name: string,
	message: string,
	choices: string[],
	defaultValue?: string,
): Promise<string> {
	const answers = await inquirer.prompt<Record<string, string>>([
		{ type: "list", name, message, choices, default: defaultValue },
	]);
	const result = answers[name];
	if (typeof result !== "string") {
		throw new Error(`Expected string response for prompt "${name}"`);
	}
	return result;
}

/**
 * Prompts the user for a yes/no confirmation.
 * @param name - The name/key for the prompt answer
 * @param message - The message to display to the user
 * @param defaultValue - Optional default value
 * @returns Boolean indicating user's choice
 */
export async function promptConfirm(
	name: string,
	message: string,
	defaultValue?: boolean,
): Promise<boolean> {
	const answers = await inquirer.prompt<Record<string, boolean>>([
		{ type: "confirm", name, message, default: defaultValue },
	]);
	const result = answers[name];
	if (typeof result !== "boolean") {
		throw new Error(`Expected boolean response for prompt "${name}"`);
	}
	return result;
}
