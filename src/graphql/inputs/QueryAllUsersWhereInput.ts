import { z } from "zod";
import { builder } from "~/src/graphql/builder";

// Zod schema
export const queryAllUsersWhereInputSchema = z.object({
	name: z.string().optional(),
});

// GraphQL input type
export const QueryAllUsersWhereInput = builder.inputType(
	"QueryAllUsersWhereInput",
	{
		fields: (t) => ({
			name: t.string({ required: false }),
		}),
	},
);
