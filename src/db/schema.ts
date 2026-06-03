import { pgTable, serial, text, integer, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const readStatusEnum = pgEnum("read_status", ["unread", "reading", "read"]);

export const books = pgTable("books", {
  id:          serial("id").primaryKey(),
  isbn:        text("isbn").unique(),
  title:       text("title").notNull(),
  author:      text("author"),
  coverUrl:    text("cover_url"),
  publisher:   text("publisher"),
  year:        integer("year"),
  genre:       text("genre"),
  description: text("description"),
  subjects:         text("subjects"),      // JSON array stored as text
  language:         text("language"),
  firstPublishedYear: integer("first_published_year"),
  ratingsAverage:   text("ratings_average"),
  ratingsCount:     integer("ratings_count"),
  pageCount:        integer("page_count"),
  seriesId:       integer("series_id").references(() => series.id, { onDelete: "set null" }),
  seriesPosition: integer("series_position"),
  addedAt:     timestamp("added_at").defaultNow().notNull(),
  readStatus:  readStatusEnum("read_status").default("unread").notNull(),
  startedAt:   timestamp("started_at"),
  finishedAt:  timestamp("finished_at"),
});

export const shelves = pgTable("shelves", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
});

export const bookLocations = pgTable("book_locations", {
  id:       serial("id").primaryKey(),
  bookId:   integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  shelfId:  integer("shelf_id").references(() => shelves.id, { onDelete: "set null" }),
  row:      text("row"),
  position: integer("position"),
  notes:    text("notes"),
});

export const checkouts = pgTable("checkouts", {
  id:              serial("id").primaryKey(),
  bookId:          integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  borrowerName:    text("borrower_name").notNull(),
  borrowerContact: text("borrower_contact"),
  checkedOutAt:    timestamp("checked_out_at").defaultNow().notNull(),
  dueDate:         date("due_date"),
  returnedAt:      timestamp("returned_at"),
});

export const series = pgTable("series", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),
  totalBooks:  integer("total_books"),
  description: text("description"),
});

export const contacts = pgTable("contacts", {
  id:    serial("id").primaryKey(),
  name:  text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
});

export const seriesRelations = relations(series, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  location:  one(bookLocations, { fields: [books.id], references: [bookLocations.bookId] }),
  checkouts: many(checkouts),
  series:    one(series, { fields: [books.seriesId], references: [series.id] }),
}));

export const shelvesRelations = relations(shelves, ({ many }) => ({
  locations: many(bookLocations),
}));

export const bookLocationsRelations = relations(bookLocations, ({ one }) => ({
  book:  one(books,   { fields: [bookLocations.bookId],  references: [books.id] }),
  shelf: one(shelves, { fields: [bookLocations.shelfId!], references: [shelves.id] }),
}));

export const checkoutsRelations = relations(checkouts, ({ one }) => ({
  book: one(books, { fields: [checkouts.bookId], references: [books.id] }),
}));
