import { builder } from "../builder";
import { z } from "zod";

export const organizationPostsArgumentsSchema = z
    .object({
        skip: z.number().min(0).optional(),
        first: z.number().min(0).max(50).optional(),
        where: z
            .object({
                caption_contains: z.string().optional(),
                creatorId: z.string().uuid().optional(),
                isPinned: z.boolean().optional(),
            })
            .optional(),
    })
    .transform((args) => ({
        skip: args.skip ?? 0,
        first: args.first ?? 10,
        where: args.where,
    }));

export const PostWhereInput = builder.inputType("PostWhereInput", {
    fields: (t) => ({
        caption_contains: t.string({
            description: "Filter by caption containing this string",
        }),
        creatorId: t.string({
            description: "Filter by creator ID",
        }),
        isPinned: t.boolean({
            description: "Filter pinned/unpinned posts",
        }),
    }),
});