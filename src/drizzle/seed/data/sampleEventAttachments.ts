import type { InferInsertModel } from "drizzle-orm";
import type { eventAttachmentsTable } from "../../schema";

type EventAttachmentInsertType = InferInsertModel<typeof eventAttachmentsTable>;

export const sampleEventAttachments: EventAttachmentInsertType[] = [
	{
		createdAt: new Date("2024-11-01T10:00:00Z"),
		creatorId: "550e8400-e29b-41d4-a716-446655440007",
		deletedAt: null,
		eventId: "550e8400-e29b-41d4-a716-446655440003",
		position: 1,
		updatedAt: new Date("2024-11-02T14:00:00Z"),
		updaterId: "550e8400-e29b-41d4-a716-446655440008",
		uri: "https://example.com/attachments/attachment1.pdf",
		type: "video",
	},
	{
		createdAt: new Date("2024-11-03T11:30:00Z"),
		creatorId: "550e8400-e29b-41d4-a716-446655440008",
		deletedAt: null,
		eventId: "550e8400-e29b-41d4-a716-446655440002",
		position: 2,
		updatedAt: new Date("2024-11-04T15:45:00Z"),
		updaterId: "550e8400-e29b-41d4-a716-446655440007",
		uri: "https://example.com/attachments/image1.png",
		type: "image",
	},
];
