interface HasRole {
	role?: string | null;
}

export const isEventCreatorOrAdmin = (
	currentUserId: string,
	currentUserRole: string | null | undefined,
	membership: HasRole | undefined,
	eventCreatorId: string | null,
): boolean => {
	return (
		currentUserRole === "administrator" ||
		membership?.role === "administrator" ||
		eventCreatorId === currentUserId
	);
};
