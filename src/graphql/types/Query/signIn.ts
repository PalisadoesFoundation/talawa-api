import { builder } from "~/src/graphql/builder";
import { QuerySignInInput } from "~/src/graphql/inputs/QuerySignInInput";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.queryField("signIn", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QuerySignInInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		deprecationReason: "Use REST POST /auth/signin",
		description: "Query field for a client to sign in to talawa.",
		resolve: async () => {
			throw new TalawaGraphQLError({
				message: "Use REST POST /auth/signin",
				extensions: { code: ErrorCode.DEPRECATED },
			});
		},
		type: AuthenticationPayload,
	}),
);
