import { builder } from "~/src/graphql/builder";
import { Organization } from "../Organization/Organization";
import { User } from "../User/User";

export type BlockedUser = {
	id: string;
	organization: Organization;
	user: User;
	createdAt: Date;
};

export const BlockedUser = builder
	.objectRef<BlockedUser>("BlockedUser")
	.implement({
		description: "Represents a user blocked by an organization.",
		fields: (t) => ({
			id: t.exposeID("id", {
				description: "Unique identifier of the blocked user.",
			}),
			organization: t.expose("organization", {
				description: "Organization that blocked the user.",
				type: Organization,
			}),
			user: t.expose("user", {
				description: "User who has been blocked.",
				type: User,
			}),
			createdAt: t.expose("createdAt", {
				description: "Timestamp when the user was blocked.",
				type: "Date",
			}),
		}),
	});
