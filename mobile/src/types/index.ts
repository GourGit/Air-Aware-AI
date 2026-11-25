export interface AirQualityReading {
  aqi: number | null;
  category: string;
  prominent_pollutant: string | null;
  color: string;
  standard: string;
  status: 'live' | 'demo' | 'unavailable' | 'estimated_incomplete_data';
  is_standard_met: boolean;
}

export interface PollutantDetail {
  value: number;
  unit: string;
  sub_index?: number;
}

export interface AirDataResponse {
  location: {
    name: string;
    city: string;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    station_id: string | null;
  };
  air_quality: AirQualityReading;
  pollutants: Record<string, PollutantDetail>;
  health_advisory: {
    summary: string;
    precautions: string[];
  };
  metadata: {
    source: string;
    observed_at: string | null;
    retrieved_at: string;
    data_type: 'observed' | 'forecast' | 'demo' | 'unavailable';
    is_stale: boolean;
    is_demo: boolean;
    station_distance_km: number | null;
    data_freshness: 'fresh' | 'recent' | 'aging' | 'stale' | 'unknown';
  };
}

export interface ChatMessageMetadata {
  intent?: string;
  recommendations?: string[];
  sources?: string[];
  limitations?: string | null;
  observed_at?: string | null;
  agents_used?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent?: string;
  metadata?: ChatMessageMetadata;
}

export interface MobilityOption {
  mode: string;
  co2e_grams: number;
  co2e_saved_grams: number;
  time_minutes: number;
  pollution_exposure: 'Low' | 'Moderate' | 'High';
}