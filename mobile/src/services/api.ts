import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useMobileAuthStore } from '../store/authStore';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChatPayload {
  conversation_id?: string;
  message: string;
  latitude?: number;
  longitude?: number;
  city?: string;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  intent: string;
  supporting_data: Record<string, unknown>;
  recommendations: string[];
  limitations: string | null;
  sources: string[];
  observed_at: string | null;
  agents_used: string[];
}

export interface CommunityReportPayload {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  approx_location_name: string;
  image_url?: string;
  observed_at?: string;
}

export interface CommunityReportResponse {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  approx_location_name: string;
  image_url: string | null;
  status: string;
  observed_at: string;
  created_at: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ImpactSummaryResponse {
  total_co2e_saved_kg: number;
  total_sustainable_km: number;
  total_trips_logged: number;
  total_exposure_points: number;
  current_tier: string;
  mode_distribution: Record<string, number>;
  weekly_savings_kg: Array<{ day: string; saved_kg: number }>;
  recent_milestones: string[];
}

export interface MobilityComparePayload {
  distance_km: number;
  origin: string;
  destination: string;
  passengers?: number;
}

export interface MobilityComparison {
  mode: string;
  mode_name: string;
  distance_km: number;
  travel_time_est_mins: number;
  co2e_emissions_kg: number;
  co2e_saved_vs_car_kg: number;
  health_exposure_rating: string;
  caloric_burn_kcal: number;
}

export interface MobilityCompareResponse {
  origin: string;
  destination: string;
  distance_km: number;
  comparisons: MobilityComparison[];
  recommendation: string;
  emission_factors_source: string;
}

export interface MobilityRecordPayload {
  origin: string;
  destination: string;
  distance_km: number;
  mode_chosen: string;
  mode_baseline: string;
  duration_minutes?: number;
  trip_date: string;
}

function getBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  if (extra?.apiUrl) {
    return extra.apiUrl;
  }
  if (__DEV__) {
    return Platform.select({
      android: 'http://10.0.2.2:8000/api/v1',
      ios: 'http://localhost:8000/api/v1',
      default: 'http://localhost:8000/api/v1',
    }) || 'http://localhost:8000/api/v1';
  }
  return 'https://api.airaware.ai/api/v1';
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    });
    failedQueue = [];
  };

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const accessToken = useMobileAuthStore.getState().accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = useMobileAuthStore.getState().refreshToken;
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post<{ access_token: string; refresh_token: string }>(
            `${getBaseUrl()}/auth/refresh`,
            { refresh_token: refreshToken },
            { timeout: 10000 }
          );

          const { access_token, refresh_token } = response.data;
          const user = useMobileAuthStore.getState().user;
          if (user) {
            await useMobileAuthStore.getState().setAuth(user, access_token, refresh_token);
          }

          processQueue(null, access_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          await useMobileAuthStore.getState().logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createApiClient();

export const authApi = {
  register: async (payload: RegisterPayload): Promise<UserProfileResponse> => {
    const response = await api.post<UserProfileResponse>('/auth/register', payload);
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<AuthTokens> => {
    const response = await api.post<{ access_token: string; refresh_token: string; token_type: string }>('/auth/login', payload);
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await api.post<{ access_token: string; refresh_token: string; token_type: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<UserProfileResponse> => {
    const response = await api.get<UserProfileResponse>('/auth/me');
    return response.data;
  },
};

export const chatApi = {
  sendMessage: async (payload: ChatPayload): Promise<ChatResponse> => {
    const response = await api.post<{ success: boolean; data: ChatResponse }>('/assistant/chat', payload);
    if (!response.data.success) {
      throw new Error('Chat request failed');
    }
    return response.data.data;
  },
};

export const communityApi = {
  submitReport: async (payload: CommunityReportPayload): Promise<CommunityReportResponse> => {
    const response = await api.post<{ success: boolean; data: CommunityReportResponse }>('/community/reports', payload);
    if (!response.data.success) {
      throw new Error('Failed to submit report');
    }
    return response.data.data;
  },

  getReports: async (): Promise<CommunityReportResponse[]> => {
    const response = await api.get<{ success: boolean; data: CommunityReportResponse[]; count: number }>('/community/reports');
    return response.data.data;
  },
};

export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await api.get<{ success: boolean; data: UserProfileResponse }>('/users/profile');
    return response.data.data;
  },

  updateProfile: async (payload: Partial<UserProfileResponse>): Promise<UserProfileResponse> => {
    const response = await api.put<{ success: boolean; data: UserProfileResponse }>('/users/profile', payload);
    return response.data.data;
  },
};

export const impactApi = {
  getSummary: async (): Promise<ImpactSummaryResponse> => {
    const response = await api.get<{ success: boolean; data: ImpactSummaryResponse }>('/impact/summary');
    return response.data.data;
  },
};

export const mobilityApi = {
  compareModes: async (payload: MobilityComparePayload): Promise<MobilityCompareResponse> => {
    const response = await api.post<{ success: boolean; data: MobilityCompareResponse }>('/mobility/compare', payload);
    return response.data.data;
  },

  logTrip: async (payload: MobilityRecordPayload): Promise<{ success: boolean; data: unknown }> => {
    const response = await api.post<{ success: boolean; data: unknown }>('/mobility/records', payload);
    return response.data;
  },

  getHistory: async (): Promise<unknown[]> => {
    const response = await api.get<{ success: boolean; data: unknown[] }>('/mobility/history');
    return response.data.data;
  },
};

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    let message = 'An unexpected error occurred';
    let details: unknown = error.response?.data;

    if (error.code === 'ECONNABORTED') {
      message = 'Request timeout. Please check your connection and try again.';
    } else if (!error.response) {
      message = 'Network unavailable. Please check your internet connection.';
    } else {
      switch (status) {
        case 400:
          message = 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'Session expired. Please sign in again.';
          break;
        case 403:
          message = 'Access denied. You do not have permission for this action.';
          break;
        case 404:
          message = 'Resource not found.';
          break;
        case 409:
          message = 'Conflict. This resource already exists.';
          break;
        case 422:
          message = 'Validation error. Please check your input.';
          break;
        case 429:
          message = 'Too many requests. Please wait and try again.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = `Request failed with status ${status}`;
      }
    }

    return { status, message, details };
  }

  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }

  return { status: 0, message: 'An unknown error occurred' };
}