import { z } from 'zod';

/** All recognised event/news categories — shared with admin + alumni */
export const EVENT_CATEGORIES = [
  // NewsCorner-style (alumni posts)
  'Alumni Stories',
  'Alumni in Higher Education',
  'Campus News',
  'Newsletter',
  'Reports',
  'Testimonial',
  // Calendar-style (staff-posted events)
  'Reunion',
  'Workshop',
  'Networking',
  'Mentorship',
  'Panel',
  'Webinar',
  'Sports',
  'General',
] as const;

/** Categories that appear in the NewsCorner feed (posted by alumni) */
export const NEWSCORNER_CATEGORIES = [
  'Alumni Stories',
  'Alumni in Higher Education',
  'Campus News',
  'Newsletter',
  'Reports',
  'Testimonial',
  'Sports',
] as const;

/** Categories that appear in the calendar Events page (staff-posted) */
export const CALENDAR_CATEGORIES = [
  'Reunion',
  'Networking',
  'Mentorship',
  'Webinar',
  'Sports',
  'General',
] as const;

const preprocessDate = (val: unknown) =>
  val === '' || val === undefined || val === null ? null : new Date(val as string);

export const eventSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must not exceed 150 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  category: z.string().min(1, 'Please select a category'),
  eventDate: z.preprocess(preprocessDate, z.date({ message: 'Event date is required' })),
  venue: z.string().min(2, 'Venue must be at least 2 characters'),
  coverImageUrl: z.string().or(z.literal('')).optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  rsvpDeadline: z.preprocess(preprocessDate, z.date().nullable().optional()),
  isPublished: z.boolean().default(false),
  showOnLanding: z.boolean().optional(),
});

export type EventSchemaType = z.infer<typeof eventSchema>;
