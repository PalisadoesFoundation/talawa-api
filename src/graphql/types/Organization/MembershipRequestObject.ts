import type { MembershipRequestStatusValues } from "~/src/drizzle/enums/membershipRequestStatus";
import { builder } from "~/src/graphql/builder";
import { MembershipRequestStatusEnum } from "~/src/graphql/enums/membershipRequestStatus";

export type MembershipRequestType = {
	membershipRequestId: string;
	userId: string;
	organizationId: string;
	status: (typeof MembershipRequestStatusValues)[number];
	createdAt: Date;
};

export const MembershipRequestObject =
	builder.objectRef<MembershipRequestType>("MembershipRequest");

MembershipRequestObject.implement({
	description: "Represents a membership request to an organization.",
	fields: (t) => ({
		membershipRequestId: t.exposeID("membershipRequestId", {
			description: "Unique ID for the membership request.",
		}),
		userId: t.exposeString("userId", {
			description: "ID of the user who requested membership.",
		}),
		organizationId: t.exposeString("organizationId", {
			description: "ID of the organization.",
		}),
		status: t.field({
			type: MembershipRequestStatusEnum,
			description:
				"Status of the membership request (e.g., pending, approved, rejected).",
			resolve: (parent) => parent.status,
		}),
		createdAt: t.expose("createdAt", {
			type: "DateTime",
			description: "Timestamp when the request was created.",
		}),
	}),
});
