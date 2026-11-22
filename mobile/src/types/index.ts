export interface AirQualityReading {
  aqi: number;
  category: string;
  prominent_pollutant: string;
  color: string;
}

export interface PollutantDetail {
  value: number;
  unit: string;
  sub_index?: number;
}

export interface AirDataResponse {
  location: {
    city: string;
    station_name: string;
    latitude: number;
    longitude: number;
  };
  air_quality: AirQualityReading;
  pollutants: Record<string, PollutantDetail>;
  health_advisory: {
    summary: string;
    precautions: string[];
  };
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent?: string;
}

export interface MobilityOption {
  mode: string;
  co2e_grams: number;
  co2e_saved_grams: number;
  time_minutes: number;
  pollution_exposure: 'Low' | 'Moderate' | 'High';
}
