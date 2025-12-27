ALTER TABLE "fund_campaign_pledges" ALTER COLUMN "amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "fund_campaigns" ALTER COLUMN "goal_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "fund_campaigns" ALTER COLUMN "amount_raised" SET DATA TYPE integer;