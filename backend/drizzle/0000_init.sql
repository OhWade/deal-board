CREATE TYPE "public"."transaction_type" AS ENUM('SOLD', 'PURCHASED');--> statement-breakpoint
CREATE TABLE "add_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	CONSTRAINT "add_ons_price_non_negative" CHECK ("add_ons"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "transaction_type" NOT NULL,
	"party_name" text NOT NULL,
	"year" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"vin" varchar(17),
	"price_cents" integer NOT NULL,
	"deal_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_price_non_negative" CHECK ("transactions"."price_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "add_ons" ADD CONSTRAINT "add_ons_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "add_ons_transaction_id_idx" ON "add_ons" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transactions_type_deal_date_idx" ON "transactions" USING btree ("type","deal_date");