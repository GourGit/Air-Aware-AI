export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatar_url?: string | null;
  location?: UserLocation | null;
  health_profile?: HealthProfile | null;
  is_onboarded?: boolean;
  role?: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

export interface HealthProfile {
  age_group: 'child' | 'adult' | 'elderly';
  conditions: HealthCondition[];
  activity_level: 'sedentary' | 'moderate' | 'active';
}

export type HealthCondition =
  | 'asthma'
  | 'copd'
  | 'heart_disease'
  | 'allergies'
  | 'respiratory'
  | 'none';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
