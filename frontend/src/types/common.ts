export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  status: number;
  message: string;
  detail: string | null;
  errors: Record<string, string[]> | null;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}
