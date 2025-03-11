import { builder } from "../../builder";

export interface UploadUrlResponse {
	presignedUrl: string;
	objectName: string;
}

export const UploadUrlResponse =
	builder.objectRef<UploadUrlResponse>("UploadUrlResponse");

UploadUrlResponse.implement({
	description: "UploadUrlResponse",
	fields: (t) => ({
		presignedUrl: t.exposeString("presignedUrl"),
		objectName: t.exposeString("objectName"),
	}),
});
