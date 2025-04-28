import { TalawaGraphQLError } from "./TalawaGraphQLError";

interface HasRole {
	role?: string | null;
}

export const assertOrganizationAdmin = (
	currentUser: HasRole | undefined,
	membership: HasRole | undefined,
	errorMessage: string,
): void => {
	if (
		currentUser?.role !== "administrator" &&
		membership?.role !== "administrator"
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
				message: errorMessage,
			},
		});
	}
};
