import { builder } from "../../builder";

export interface GetUrlResponse {
	presignedUrl: string;
}

export const GetUrlResponse =
	builder.objectRef<GetUrlResponse>("GetUrlResponse");

GetUrlResponse.implement({
	description: "GetUrlResponse",
	fields: (t) => ({
		presignedUrl: t.exposeString("presignedUrl"),
	}),
});
