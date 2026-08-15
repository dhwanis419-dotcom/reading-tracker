export type WorkType = 'book' | 'short_story' | 'article';
export type FictionStatus = 'fiction' | 'non_fiction' | null;
export type Priority = 'high' | 'medium' | 'low' | null;
export type ReadingStatus = 'currently_reading' | 'paused' | 'finished' | 'dnf';

export interface Work {
  id: string;
  type: WorkType;
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number | null;
  isbn: string | null;
  edition: string | null;
  publication_info: string | null;
  fiction_status: FictionStatus;
  genres: string[];
  tags: string[];
  collections: string[];
  article_url: string | null;
  article_site: string | null;
  article_pub_date: string | null;
  article_read_time: number | null;
  created_at: string;
}

export interface TbrEntry {
  id: string;
  work_id: string;
  date_added: string;
  priority: Priority;
  notes: string | null;
  active: boolean;
  work?: Work;
}

export interface ReadingInstance {
  id: string;
  work_id: string;
  status: ReadingStatus;
  start_date: string;
  finish_date: string | null;
  last_read_date: string | null;
  current_progress: number;
  progress_unit: 'page' | 'percent';
  rating: number | null;
  favorite: boolean;
  final_review: string | null;
  created_at: string;
  work?: Work;
}

export interface ReadingEntry {
  id: string;
  reading_instance_id: string;
  date: string;
  progress_before: number;
  progress_after: number;
  amount_read: number;
  time_spent_minutes: number | null;
  thoughts: string | null;
  created_at: string;
}
