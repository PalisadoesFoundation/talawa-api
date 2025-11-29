CREATE TABLE "chat_message_read_receipts" (
	"message_id" uuid NOT NULL,
	"reader_id" uuid NOT NULL,
	"read_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_message_read_receipts_message_id_reader_id_pk" PRIMARY KEY("message_id","reader_id")
);
--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_name_unique";--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD COLUMN "last_read_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "chat_message_read_receipts_message_id_index" ON "chat_message_read_receipts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_last_read_at_index" ON "chat_memberships" USING btree ("last_read_at");