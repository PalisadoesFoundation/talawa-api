import { builder } from "~/src/graphql/builder";

export const OrganizationCustomField = builder.objectRef<{
	id: string;
	name: string;
	type: string;
	organizationId: string;
}>("OrganizationCustomField");

OrganizationCustomField.implement({
	fields: (t) => ({
		id: t.exposeID("id", { nullable: false }),
		name: t.exposeString("name", { nullable: false }),
		type: t.exposeString("type", { nullable: false }),
		organizationId: t.exposeString("organizationId", { nullable: false }),
	}),
});
