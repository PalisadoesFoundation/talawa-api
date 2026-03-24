import type { SetupAnswers } from "../setup";

export type { SetupAnswers };

export async function handlePromptError(err: unknown): Promise<never> {
	console.error(err);
	throw err;
}