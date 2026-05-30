import { z } from "zod";

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

export const UpdateBookSchema = CreateBookSchema.partial();

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

export const AssignLocationSchema = z.object({
  shelfId:  z.number().int().positive(),
  row:      z.string().optional(),
  position: z.number().int().optional(),
  notes:    z.string().optional(),
});
