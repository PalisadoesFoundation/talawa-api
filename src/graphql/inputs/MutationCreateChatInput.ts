import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationCreateChatInputSchema = z
  .object({
    userIds: z.array(z.string().uuid()).min(2),
    organizationId: z.string().uuid(),
    isGroup: z.boolean(),
    name: z.string().trim().max(128).optional(),
    image: z.string().trim().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.isGroup) {
      if (v.userIds.length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["userIds"],
          message: "A group chat needs at least 3 users.",
        });
      }
      if (!v.name || v.name.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Name is required for group chats.",
        });
      }
    } else {
      if (v.userIds.length !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["userIds"],
          message: "A direct chat must contain exactly 2 users.",
        });
      }
    }
  });

export const MutationCreateChatInput = builder
  .inputRef<z.infer<typeof mutationCreateChatInputSchema>>(
    "MutationCreateChatInput"
  )
  .implement({
    fields: (t) => ({
      userIds: t.field({ type: ["ID"], required: true }),
      organizationId: t.id({ required: true }),
      isGroup: t.boolean({ required: true }),
      name: t.string({ required: false }),
      image: t.string({ required: false }),
    }),
  });
