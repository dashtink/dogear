CREATE TABLE "book_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"shelf_id" integer,
	"row" text,
	"position" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"isbn" text,
	"title" text NOT NULL,
	"author" text,
	"cover_url" text,
	"publisher" text,
	"year" integer,
	"genre" text,
	"description" text,
	"page_count" integer,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "checkouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"borrower_name" text NOT NULL,
	"borrower_contact" text,
	"checked_out_at" timestamp DEFAULT now() NOT NULL,
	"due_date" date,
	"returned_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "book_locations" ADD CONSTRAINT "book_locations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_locations" ADD CONSTRAINT "book_locations_shelf_id_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;