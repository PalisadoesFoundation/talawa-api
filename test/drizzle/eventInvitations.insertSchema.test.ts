import { describe, it, expect } from "vitest";
import { eventInvitationsTableInsertSchema } from "~/src/drizzle/tables/eventInvitations";

describe("eventInvitations insert schema", () => {
	it("validates inviteeEmail as email()", () => {
		const base = { inviteeEmail: "user@example.com", expiresAt: new Date() };
		expect(eventInvitationsTableInsertSchema.safeParse(base).success).toBe(
			true,
		);
		const bad = { ...base, inviteeEmail: "not-an-email" };
		expect(eventInvitationsTableInsertSchema.safeParse(bad).success).toBe(
			false,
		);
	});
});
