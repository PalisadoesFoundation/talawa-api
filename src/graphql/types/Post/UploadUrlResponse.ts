import { builder } from "../../builder";

export interface UploadUrlResponse {
    presignedUrl: string | null; 
    objectName: string | null;
    exists: boolean;
}

export const UploadUrlResponse =
    builder.objectRef<UploadUrlResponse>("UploadUrlResponse");

UploadUrlResponse.implement({
    description: "UploadUrlResponse",
    fields: (t) => ({
        presignedUrl: t.exposeString("presignedUrl", {
            nullable: true, 
        }),
        objectName: t.exposeString("objectName",{
			nullable: true,
		}),
        exists: t.exposeBoolean("exists"),
    }),
});