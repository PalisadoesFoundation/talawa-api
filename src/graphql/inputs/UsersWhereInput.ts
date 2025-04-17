import { z } from "zod";
import { builder } from "~/src/graphql/builder";

const emptyToUndefined = (v: string | undefined) =>
	v?.trim() === "" ? undefined : v;

export const usersWhereInputSchema = z.object({
	id_not_in: z.array(z.string().uuid()).optional(),

	firstName_contains: z.string().optional().transform(emptyToUndefined),

	lastName_contains: z.string().optional().transform(emptyToUndefined),
});

export const UsersWhereInput = builder
	.inputRef<z.infer<typeof usersWhereInputSchema>>("UsersWhereInput")
	.implement({
		fields: (t) => ({
			id_not_in: t.field({ type: ["ID"], required: false }),
			firstName_contains: t.string({ required: false }),
			lastName_contains: t.string({ required: false }),
		}),
	});
