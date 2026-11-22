import api from './api';

export interface AirQualityData {
  location: {
    name: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    station_id: string;
  };
  air_quality: {
    aqi: number;
    category: string;
    color: string;
    prominent_pollutant: string;
    standard: string;
    status: string;
  };
  pollutants: Record<string, { value: number; unit: string; sub_index?: number }>;
  health_advisory: {
    summary: string;
    precautions: string[];
  };
  metadata: {
    source: string;
    observed_at: string;
    retrieved_at: string;
  };
}

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  agency: string;
  latitude: number;
  longitude: number;
  aqi: number;
  category: string;
  color: string;
  prominent_pollutant: string;
  pollutants: Record<string, number>;
  last_updated: string;
  source: string;
}

export const airQualityService = {
  getCurrentAir: async (city?: string, lat?: number, lng?: number): Promise<AirQualityData> => {
    const res = await api.get('/air/current', { params: { city, lat, lng } });
    return res.data.data;
  },
  getStations: async (city?: string): Promise<Station[]> => {
    const res = await api.get('/air/stations', { params: { city } });
    return res.data.data;
  },
  getForecast: async (lat?: number, lng?: number, days: number = 3) => {
    const res = await api.get('/air/forecast', { params: { lat, lng, days } });
    return res.data.data;
  },
};
