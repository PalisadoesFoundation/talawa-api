import { builder } from "~/src/graphql/builder";

export interface ReadNotificationResponseShape {
	success: boolean;
	message?: string;
}

export const ReadNotificationResponse =
	builder.objectRef<ReadNotificationResponseShape>("ReadNotificationResponse");

ReadNotificationResponse.implement({
	fields: (t) => ({
		success: t.exposeBoolean("success", { nullable: false }),
		message: t.exposeString("message", { nullable: true }),
	}),
});
