CREATE TYPE "public"."user_role" AS ENUM('sales', 'manager', 'admin');--> statement-breakpoint
CREATE TABLE "rfp_files_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rfps_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"client_name" text NOT NULL,
	"description" text,
	"submission_date" date,
	"submitted_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "posts_table" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "posts_table" CASCADE;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "role" "user_role" DEFAULT 'sales' NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "manager_id" uuid;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "rfp_files_table" ADD CONSTRAINT "rfp_files_table_rfp_id_rfps_table_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfps_table" ADD CONSTRAINT "rfps_table_submitted_by_users_table_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_manager_id_users_table_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_table" DROP COLUMN "age";