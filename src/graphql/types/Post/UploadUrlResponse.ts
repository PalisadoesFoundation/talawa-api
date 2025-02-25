import { builder } from "../../builder";

export interface UploadUrlResponse {
  presignedUrl: string;
  fileUrl: string;
}

export const UploadUrlResponse =
           builder.objectRef<UploadUrlResponse>("UploadUrlResponse");

UploadUrlResponse.implement({
  description: "UploadUrlResponse",
  fields: (t) => ({
    presignedUrl: t.exposeString("presignedUrl"),
    fileUrl: t.exposeString("fileUrl"),
  }),
});
    