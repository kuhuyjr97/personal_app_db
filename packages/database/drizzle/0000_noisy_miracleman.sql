CREATE TABLE IF NOT EXISTS "note" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text,
	"stage" text,
	"state" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text,
	"name" text,
	"user_id" text,
	"amount" text,
	"detail" text,
	"note" text,
	"priority" text,
	"recieved_day" text,
	"material" text,
	"xlbm" text,
	"condition" text,
	"surface_type" text,
	"deadline" text,
	"typed_person" text,
	"is_finished" text,
	"confirmed_person" text,
	"img_url" text,
	"file_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_detail_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text,
	"name" text,
	"amount" text,
	"stage" text,
	"state" text,
	"ok_amount" text,
	"ng_amount" text,
	"ng_times" text,
	"fix_times" text,
	"content" text,
	"reason" text,
	"detail" text,
	"solution" text,
	"conclusion" text,
	"note" text,
	"evaluation" text,
	"confirmed_person1" text,
	"confirmed_person2" text,
	"confirmed_person3" text,
	"in_confirmed" text,
	"approved_person" text,
	"is_recieved" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"code" text NOT NULL,
	"password" text,
	"position" text,
	"role" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"site_code" text,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
