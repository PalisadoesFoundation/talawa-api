import { builder } from "~/src/graphql/builder";
import { tagAssignmentsTable } from "~/src/drizzle/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { and, inArray } from "drizzle-orm";
import { z } from "zod";

// Input validation schema
const RemoveFromUserTagsInput = builder.inputType("RemoveFromUserTagsInput", {
  fields: (t) => ({
    currentTagId: t.string({ required: true }),
    selectedTagIds: t.stringList({ required: true }),
  }),
});

const validateTagActions = (args: any) => {
  const schema = z.object({
    input: z.object({
      currentTagId: z.string(),
      selectedTagIds: z.array(z.string()),
    }),
  });
  
  return schema.parse(args);
};

builder.mutationField("removeFromUserTags", (t) =>
  t.field({
    type: "Tag",
    nullable: true,
    args: {
      input: t.arg({
        type: RemoveFromUserTagsInput,
        required: true,
      }),
    },
    resolve: async (_parent, args, ctx) => {
      const { currentTagId, selectedTagIds } = args.input;

      if (!currentTagId || !selectedTagIds?.length) {
        return null;
      }

      try {
        const tag = await ctx.drizzleClient.query.tagsTable.findFirst({
          where: (fields) => fields.id.equals(currentTagId),
          with: {
            organization: true,
          },
        });

        if (!tag) {
          return null;
        }

        await ctx.drizzleClient.delete(tagAssignmentsTable)
          .where(
            and(
              tagAssignmentsTable.assigneeId.equals(currentTagId),
              inArray(tagAssignmentsTable.tagId, selectedTagIds)
            )
          );

        return tag;
      } catch (error) {
        console.error("Error in removeFromUserTags:", error);
        return null;
      }
    },
  })
);
