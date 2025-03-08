import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationCreatePresignedUrlInputSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  organizationId: z.string(),
  objectName: z.string().optional(),
});

export const MutationCreatePresignedUrlInput = builder
  .inputRef<z.infer<typeof mutationCreatePresignedUrlInputSchema>>(
    "MutationCreatePresignedUrlInput",
  )
  .implement({
    description: "Input for creating a presigned URL for file upload",
    fields: (t) => ({
      fileName: t.string({
        description: "Name of the file to be uploaded",
        required: true,
      }),
      fileType: t.string({
        description: "MIME type of the file",
        required: true,
      }),
      organizationId: t.id({
        description: "ID of the organization the file belongs to",
        required: true,
      }),
      objectName: t.string({
        description: "Custom object name for the file (optional)",
        required: false,
      }),
    }),
  });