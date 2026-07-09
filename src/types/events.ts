/**
 * Shared types for the Events / NewsCorner feature.
 * Imported by alumni pages, admin page, and server actions.
 */

export interface EventItemType {
  id: string;
  title: string;
  description: string;
  category: string;
  eventDate: Date | string;
  venue: string;
  coverImageUrl: string | null;
  rsvpDeadline: Date | string | null;
  isPublished: boolean;
  createdAt: Date | string;

  postedByAlumniId: string | null;
  postedByStaffId: string | null;

  postedByAlumni?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    currentRole: string | null;
  } | null;
  postedByStaff?: {
    id: string;
    name: string;
  } | null;

  // Derived fields added by server actions
  attendingCount: number;
  maybeCount: number;
  totalRsvps: number;
  myRsvp?: {
    status: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';
    message: string | null;
  } | null;
  postedByMe: boolean;
}

export interface RsvpRespondent {
  id: string;
  status: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';
  message: string | null;
  respondedAt: string;
  alumni: {
    id: string;
    name: string;
    email: string;
    batchYear: number;
    branch: string;
    course: string | null;
    currentRole: string | null;
    currentCompany: string | null;
    avatarUrl: string | null;
  };
}

export interface RsvpDetailsType {
  eventTitle: string;
  eventDate: string;
  totalCount: number;
  attendingCount: number;
  maybeCount: number;
  notAttendingCount: number;
  rsvps: RsvpRespondent[];
}

export interface EventsApiResponse {
  events: EventItemType[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface EventFilterParams {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  tab?: 'all' | 'posted' | 'attended' | 'alumni' | 'staff';
  page?: number;
  limit?: number;
  showDrafts?: boolean;
  /** If provided, only fetch events whose category is in this list */
  categoryScope?: string[];
  postedBy?: 'staff' | 'alumni';
}
