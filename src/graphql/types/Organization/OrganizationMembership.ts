import { builder } from "~/src/graphql/builder";

// Rename TypeScript type to avoid naming conflict
export type OrganizationMembershipType = {
	memberId: string;
	organizationId: string;
	role: string;
	// creatorId: string | null;
}; // Define GraphQL object reference with a new name
export const OrganizationMembershipObject =
	builder.objectRef<OrganizationMembershipType>("OrganizationMembershipObject");

// Implement the GraphQL type
OrganizationMembershipObject.implement({
	description: "Represents a user's membership in an organization.",
	fields: (t) => ({
		memberId: t.exposeString("memberId", {
			description: "ID of the member.",
		}),
		organizationId: t.exposeString("organizationId", {
			description: "ID of the organization.",
		}),
		role: t.exposeString("role", {
			description: "Role of the member in the organization.",
		}),
		// creatorId: t.exposeString("creatorId", {
		// 	description: "User ID who created the membership.",
		// }),
	}),
});
