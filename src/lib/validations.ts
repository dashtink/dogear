import { z } from "zod";

export const ReadStatusSchema = z.enum(["unread", "reading", "read"]);

export const CreateBookSchema = z.object({
  isbn:        z.string().regex(/^\d{10}(\d{3})?$/).optional(),
  title:       z.string().min(1),
  author:      z.string().nullable().optional(),
  coverUrl:    z.string().nullable().optional(),
  publisher:   z.string().nullable().optional(),
  year:        z.number().int().min(1000).max(2100).optional().nullable(),
  genre:       z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  subjects:           z.string().nullable().optional(),
  language:           z.string().nullable().optional(),
  firstPublishedYear: z.number().int().nullable().optional(),
  ratingsAverage:     z.string().nullable().optional(),
  ratingsCount:       z.number().int().nullable().optional(),
  pageCount:          z.number().int().positive().optional().nullable(),
});

export const UpdateBookSchema = CreateBookSchema.partial().extend({
  readStatus:     ReadStatusSchema.optional(),
  startedAt:      z.string().nullable().optional(),
  finishedAt:     z.string().nullable().optional(),
  seriesId:       z.number().int().positive().nullable().optional(),
  seriesPosition: z.number().int().positive().nullable().optional(),
});

export const CreateCheckoutSchema = z.object({
  bookId:          z.number().int().positive(),
  borrowerName:    z.string().min(1),
  borrowerContact: z.string().optional(),
  dueDate:         z.string().optional(),
});

export const CreateShelfSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
});

export const CreateSeriesSchema = z.object({
  name:        z.string().min(1),
  totalBooks:  z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const CreateContactSchema = z.object({
  name:  z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const AssignLocationSchema = z.object({
  shelfId:  z.number().int().positive(),
  row:      z.string().optional(),
  position: z.number().int().optional(),
  notes:    z.string().optional(),
});
