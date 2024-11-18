import { builder } from "~/src/graphql/builder";

builder.queryField("hello", (t) =>
	t.string({
		args: {
			name: t.arg.string({
				required: true,
			}),
		},
		resolve: async (_parent, args) => args.name,
	}),
);
