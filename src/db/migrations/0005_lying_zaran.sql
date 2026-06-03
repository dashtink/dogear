CREATE TABLE "series" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_books" integer,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "series_id" integer;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "series_position" integer;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;