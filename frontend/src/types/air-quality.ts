export type AQICategory = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'veryPoor' | 'severe';

export interface Pollutant {
  name: PollutantName;
  value: number;
  unit: string;
  sub_index: number;
}

export type PollutantName = 'PM2.5' | 'PM10' | 'NO2' | 'SO2' | 'CO' | 'O3' | 'NH3' | 'Pb';

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export interface AirQualityData {
  station: Station;
  aqi: number;
  category: AQICategory;
  dominant_pollutant: PollutantName;
  pollutants: Pollutant[];
  timestamp: string;
  source: string;
}

export interface AirQualityForecast {
  station_id: string;
  forecasts: ForecastEntry[];
}

export interface ForecastEntry {
  timestamp: string;
  aqi: number;
  category: AQICategory;
  dominant_pollutant: PollutantName;
  confidence: number;
}

export interface HealthRecommendation {
  category: AQICategory;
  general: string;
  outdoor_activity: string;
  sensitive_groups: string;
  mask_recommendation: string;
  ventilation: string;
}

export interface AQIBreakpoint {
  category: AQICategory;
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}
