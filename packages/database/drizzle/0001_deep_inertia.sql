CREATE TABLE IF NOT EXISTS "daily_note" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
