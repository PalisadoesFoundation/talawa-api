import { builder } from "~/src/graphql/builder";
import { MutationSignUpInput } from "~/src/graphql/inputs/MutationSignUpInput";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.mutationField("signUp", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationSignUpInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		deprecationReason: "Use REST POST /auth/signup",
		description: "Mutation field to sign up to talawa.",
		resolve: async () => {
			throw new TalawaGraphQLError({
				message: "Use REST POST /auth/signup",
				extensions: { code: ErrorCode.DEPRECATED },
			});
		},
		type: AuthenticationPayload,
	}),
);
