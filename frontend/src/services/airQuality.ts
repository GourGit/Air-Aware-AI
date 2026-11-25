export interface PollutantDetail {
  value: number;
  unit: string;
  sub_index?: number;
}

export interface ForecastPoint {
  time: string;
  predicted_aqi: number | null;
  predicted_category: string;
  color: string;
  prominent_pollutant: string | null;
  is_standard_met: boolean;
  source: string;
  data_type: 'forecast';
  model: string;
  retrieved_at: string;
  forecast_valid_at: string;
}

export interface AirQualityData {
  location: {
    name: string;
    city: string;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    station_id: string | null;
  };
  air_quality: {
    aqi: number | null;
    category: string;
    color: string;
    prominent_pollutant: string | null;
    standard: string;
    status: 'live' | 'demo' | 'unavailable' | 'estimated_incomplete_data';
    is_standard_met: boolean;
  };
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

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  agency: string;
  latitude: number;
  longitude: number;
  aqi: number | null;
  category: string;
  color: string;
  prominent_pollutant: string | null;
  pollutants: Record<string, number>;
  last_updated: string | null;
  source: string;
  is_demo: boolean;
  is_authoritative: boolean;
  is_sample?: boolean; // Alias for is_demo for backward compatibility
}

import api from './api';

const FALLBACK_AIR_DATA: Record<string, AirQualityData> = {
  delhi: {
    location: {
      name: 'Anand Vihar, Delhi — DPCC (Demo Data)',
      city: 'Delhi',
      state: 'Delhi',
      latitude: 28.6508,
      longitude: 77.3152,
      station_id: 'demo-dl-001',
    },
    air_quality: {
      aqi: 342,
      category: 'Very Poor',
      color: '#CC0033',
      prominent_pollutant: 'pm25',
      standard: 'IN_CPCB',
      status: 'demo',
      is_standard_met: true,
    },
    pollutants: {
      pm25: { value: 178.0, unit: 'µg/m³', sub_index: 342 },
      pm10: { value: 292.0, unit: 'µg/m³', sub_index: 242 },
      no2: { value: 68.0, unit: 'µg/m³', sub_index: 85 },
      so2: { value: 19.5, unit: 'µg/m³', sub_index: 24 },
      co: { value: 1.9, unit: 'mg/m³', sub_index: 95 },
      o3: { value: 38.0, unit: 'µg/m³', sub_index: 38 },
      nh3: { value: 35.0, unit: 'µg/m³', sub_index: 42 },
    },
    health_advisory: {
      summary: 'Demo Data: Very poor air quality. Respiratory illness risk on prolonged exposure.',
      precautions: [
        'Avoid outdoor exercise and strenuous activities.',
        'Wear certified N95/FFP2 respirator when commuting.',
        'Use indoor air purifiers with HEPA filters.',
      ],
    },
    metadata: {
      source: 'Official DPCC CAAQMS (Demo Data)',
      observed_at: null,
      retrieved_at: new Date().toISOString(),
      data_type: 'demo',
      is_stale: true,
      is_demo: true,
      station_distance_km: null,
      data_freshness: 'unknown',
    },
  },
  mumbai: {
    location: {
      name: 'Bandra Kurla Complex, Mumbai — MPCB (Demo Data)',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0657,
      longitude: 72.8683,
      station_id: 'demo-mh-001',
    },
    air_quality: {
      aqi: 185,
      category: 'Moderate',
      color: '#FFCC00',
      prominent_pollutant: 'pm10',
      standard: 'IN_CPCB',
      status: 'demo',
      is_standard_met: true,
    },
    pollutants: {
      pm25: { value: 112.0, unit: 'µg/m³', sub_index: 185 },
      pm10: { value: 178.0, unit: 'µg/m³', sub_index: 148 },
      no2: { value: 48.0, unit: 'µg/m³', sub_index: 60 },
      so2: { value: 16.5, unit: 'µg/m³', sub_index: 21 },
      co: { value: 1.2, unit: 'mg/m³', sub_index: 60 },
      o3: { value: 36.0, unit: 'µg/m³', sub_index: 36 },
      nh3: { value: 25.0, unit: 'µg/m³', sub_index: 13 },
    },
    health_advisory: {
      summary: 'Demo Data: Moderate air quality. Breathing discomfort for sensitive groups.',
      precautions: [
        'People with respiratory/heart conditions should limit outdoor exertion.',
        'Consider wearing N95 mask during high traffic hours.',
      ],
    },
    metadata: {
      source: 'Official MPCB CAAQMS (Demo Data)',
      observed_at: null,
      retrieved_at: new Date().toISOString(),
      data_type: 'demo',
      is_stale: true,
      is_demo: true,
      station_distance_km: null,
      data_freshness: 'unknown',
    },
  },
  kolkata: {
    location: {
      name: 'Salt Lake Sector V, Kolkata — WBPCB (Demo Data)',
      city: 'Kolkata',
      state: 'West Bengal',
      latitude: 22.5800,
      longitude: 88.4370,
      station_id: 'demo-wb-001',
    },
    air_quality: {
      aqi: 145,
      category: 'Moderate',
      color: '#FFCC00',
      prominent_pollutant: 'pm25',
      standard: 'IN_CPCB',
      status: 'demo',
      is_standard_met: true,
    },
    pollutants: {
      pm25: { value: 88.0, unit: 'µg/m³', sub_index: 145 },
      pm10: { value: 145.0, unit: 'µg/m³', sub_index: 116 },
      no2: { value: 42.0, unit: 'µg/m³', sub_index: 53 },
      so2: { value: 11.2, unit: 'µg/m³', sub_index: 14 },
      co: { value: 0.85, unit: 'mg/m³', sub_index: 43 },
      o3: { value: 32.0, unit: 'µg/m³', sub_index: 32 },
      nh3: { value: 22.0, unit: 'µg/m³', sub_index: 11 },
    },
    health_advisory: {
      summary: 'Demo Data: Moderate air quality. Minor discomfort for sensitive individuals.',
      precautions: [
        'Sensitive individuals may experience minor breathing discomfort.',
        'Normal outdoor activities permissible.',
      ],
    },
    metadata: {
      source: 'Official WBPCB CAAQMS (Demo Data)',
      observed_at: null,
      retrieved_at: new Date().toISOString(),
      data_type: 'demo',
      is_stale: true,
      is_demo: true,
      station_distance_km: null,
      data_freshness: 'unknown',
    },
  },
  bengaluru: {
    location: {
      name: 'Silk Board, Bengaluru — KSPCB (Demo Data)',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9172,
      longitude: 77.6228,
      station_id: 'demo-ka-001',
    },
    air_quality: {
      aqi: 94,
      category: 'Satisfactory',
      color: '#99CC33',
      prominent_pollutant: 'pm10',
      standard: 'IN_CPCB',
      status: 'demo',
      is_standard_met: true,
    },
    pollutants: {
      pm25: { value: 58.0, unit: 'µg/m³', sub_index: 97 },
      pm10: { value: 94.0, unit: 'µg/m³', sub_index: 94 },
      no2: { value: 34.0, unit: 'µg/m³', sub_index: 43 },
      so2: { value: 8.0, unit: 'µg/m³', sub_index: 10 },
      co: { value: 0.65, unit: 'mg/m³', sub_index: 33 },
      o3: { value: 28.0, unit: 'µg/m³', sub_index: 28 },
      nh3: { value: 18.0, unit: 'µg/m³', sub_index: 9 },
    },
    health_advisory: {
      summary: 'Demo Data: Satisfactory air quality. Minor discomfort possible for sensitive people.',
      precautions: [
        'Sensitive individuals should consider reducing prolonged outdoor exertion.',
      ],
    },
    metadata: {
      source: 'Official KSPCB CAAQMS (Demo Data)',
      observed_at: null,
      retrieved_at: new Date().toISOString(),
      data_type: 'demo',
      is_stale: true,
      is_demo: true,
      station_distance_km: null,
      data_freshness: 'unknown',
    },
  },
  chennai: {
    location: {
      name: 'Alandur, Chennai — TNPCB (Demo Data)',
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0033,
      longitude: 80.2016,
      station_id: 'demo-tn-001',
    },
    air_quality: {
      aqi: 74,
      category: 'Satisfactory',
      color: '#99CC33',
      prominent_pollutant: 'pm10',
      standard: 'IN_CPCB',
      status: 'demo',
      is_standard_met: true,
    },
    pollutants: {
      pm25: { value: 42.0, unit: 'µg/m³', sub_index: 70 },
      pm10: { value: 74.0, unit: 'µg/m³', sub_index: 74 },
      no2: { value: 26.0, unit: 'µg/m³', sub_index: 33 },
      so2: { value: 7.2, unit: 'µg/m³', sub_index: 9 },
      co: { value: 0.52, unit: 'mg/m³', sub_index: 26 },
      o3: { value: 22.0, unit: 'µg/m³', sub_index: 22 },
      nh3: { value: 15.0, unit: 'µg/m³', sub_index: 8 },
    },
    health_advisory: {
      summary: 'Demo Data: Satisfactory air quality. Clean coastal dispersion.',
      precautions: ['Ideal conditions for outdoor activity.'],
    },
    metadata: {
      source: 'Official TNPCB CAAQMS (Demo Data)',
      observed_at: null,
      retrieved_at: new Date().toISOString(),
      data_type: 'demo',
      is_stale: true,
      is_demo: true,
      station_distance_km: null,
      data_freshness: 'unknown',
    },
  },
  lucknow: {
    location: {
      name: 'Talkatora, Lucknow — UPPCB (Demo Data)',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      latitude: 26.8322,
      longitude: 80.8988,
      station_id: 'demo-up-001',
    },
    air_quality: {
      aqi: 265,
      category: 'Poor',
      color: '#FF9933',
      prominent_pollutant: 'pm25',
      standard: 'IN_CPCB',
      status: 'demo',
      is_standard_met: true,
    },
    pollutants: {
      pm25: { value: 164.0, unit: 'µg/m³', sub_index: 265 },
      pm10: { value: 265.0, unit: 'µg/m³', sub_index: 212 },
      no2: { value: 59.0, unit: 'µg/m³', sub_index: 74 },
      so2: { value: 18.2, unit: 'µg/m³', sub_index: 23 },
      co: { value: 1.6, unit: 'mg/m³', sub_index: 80 },
      o3: { value: 35.0, unit: 'µg/m³', sub_index: 35 },
      nh3: { value: 30.0, unit: 'µg/m³', sub_index: 15 },
    },
    health_advisory: {
      summary: 'Demo Data: Poor air quality. Discomfort for most people on prolonged exposure.',
      precautions: [
        'Reduce prolonged outdoor activities.',
        'Wear N95/FFP2 mask when outdoors.',
        'Keep windows closed during peak traffic hours.',
      ],
    },
    metadata: {
      source: 'Official UPPCB CAAQMS (Demo Data)',
      observed_at: null,
      retrieved_at: new Date().toISOString(),
      data_type: 'demo',
      is_stale: true,
      is_demo: true,
      station_distance_km: null,
      data_freshness: 'unknown',
    },
  },
};

const FALLBACK_STATIONS: Station[] = [
  {
    id: 'demo-dl-001',
    name: 'Anand Vihar, Delhi — DPCC (Demo Data)',
    city: 'Delhi',
    state: 'Delhi',
    agency: 'Delhi Pollution Control Committee',
    latitude: 28.6508,
    longitude: 77.3152,
    aqi: 342,
    category: 'Very Poor',
    color: '#CC0033',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 178, pm10: 292, no2: 68, so2: 19.5, co: 1.9, o3: 38, nh3: 35 },
    last_updated: null,
    source: 'Official CAAQMS (Demo Data)',
    is_demo: true,
    is_authoritative: false,
  },
  {
    id: 'demo-dl-002',
    name: 'R K Puram, Delhi — DPCC (Demo Data)',
    city: 'Delhi',
    state: 'Delhi',
    agency: 'DPCC',
    latitude: 28.5633,
    longitude: 77.1864,
    aqi: 265,
    category: 'Poor',
    color: '#FF9933',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 142, pm10: 235, no2: 52, so2: 14, co: 1.4, o3: 44, nh3: 28 },
    last_updated: null,
    source: 'Official CAAQMS (Demo Data)',
    is_demo: true,
    is_authoritative: false,
  },
  {
    id: 'demo-mh-001',
    name: 'Bandra Kurla Complex, Mumbai — MPCB (Demo Data)',
    city: 'Mumbai',
    state: 'Maharashtra',
    agency: 'Maharashtra PCB',
    latitude: 19.0657,
    longitude: 72.8683,
    aqi: 185,
    category: 'Moderate',
    color: '#FFCC00',
    prominent_pollutant: 'pm10',
    pollutants: { pm25: 112, pm10: 178, no2: 48, so2: 16.5, co: 1.2, o3: 36, nh3: 25 },
    last_updated: null,
    source: 'Official CAAQMS (Demo Data)',
    is_demo: true,
    is_authoritative: false,
  },
  {
    id: 'demo-ka-001',
    name: 'Silk Board, Bengaluru — KSPCB (Demo Data)',
    city: 'Bengaluru',
    state: 'Karnataka',
    agency: 'Karnataka SPCB',
    latitude: 12.9172,
    longitude: 77.6228,
    aqi: 94,
    category: 'Satisfactory',
    color: '#99CC33',
    prominent_pollutant: 'pm10',
    pollutants: { pm25: 58, pm10: 94, no2: 34, so2: 8.0, co: 0.65, o3: 28, nh3: 18 },
    last_updated: null,
    source: 'Official CAAQMS (Demo Data)',
    is_demo: true,
    is_authoritative: false,
  },
  {
    id: 'demo-wb-001',
    name: 'Salt Lake Sector V, Kolkata — WBPCB (Demo Data)',
    city: 'Kolkata',
    state: 'West Bengal',
    agency: 'West Bengal PCB',
    latitude: 22.5800,
    longitude: 88.4370,
    aqi: 145,
    category: 'Moderate',
    color: '#FFCC00',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 88, pm10: 145, no2: 42, so2: 11.2, co: 0.85, o3: 32, nh3: 22 },
    last_updated: null,
    source: 'Official CAAQMS (Demo Data)',
    is_demo: true,
    is_authoritative: false,
  },
  {
    id: 'demo-tn-001',
    name: 'Alandur, Chennai — TNPCB (Demo Data)',
    city: 'Chennai',
    state: 'Tamil Nadu',
    agency: 'Tamil Nadu PCB',
    latitude: 13.0033,
    longitude: 80.2016,
    aqi: 74,
    category: 'Satisfactory',
    color: '#99CC33',
    prominent_pollutant: 'pm10',
    pollutants: { pm25: 42, pm10: 74, no2: 26, so2: 7.2, co: 0.52, o3: 22, nh3: 15 },
    last_updated: null,
    source: 'Official CAAQMS (Demo Data)',
    is_demo: true,
    is_authoritative: false,
  },
  {
    id: 'demo-up-001',
    name: 'Talkatora, Lucknow — UPPCB (Demo Data)',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    agency: 'UP Pollution Control Board',
    latitude: 26.8322,
    longitude: 80.8988,
    aqi: 265,
    category: 'Poor',
    color: '#FF9933',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 164, pm10: 265, no2: 59, so2: 18.2, co: 1.6, o3: 35, nh3: 30 },
    last_updated: null,
    source: 'Official CAAQMS (Demo Data)',
    is_demo: true,
    is_authoritative: false,
  },
];

function createUnavailableResponse(city: string | undefined, lat: number | undefined, lng: number | undefined): AirQualityData {
  return {
    location: {
      name: `No Monitoring Station for ${city || 'Location'}`,
      city: city || 'Unknown',
      state: 'N/A',
      latitude: lat || 0,
      longitude: lng || 0,
      station_id: `unavailable-${city || 'loc'}`,
    },
    air_quality: {
      aqi: null,
      category: 'Data Unavailable',
      color: '#71818A',
      prominent_pollutant: null,
      standard: 'IN_CPCB',
      status: 'unavailable',
      is_standard_met: false,
    },
    pollutants: {},
    health_advisory: {
      summary: `Real-time CPCB monitoring data for ${city || 'this location'} is currently unavailable.`,
      precautions: ['Please select a supported monitoring city or check network connection.'],
    },
    metadata: {
      source: 'Data Unavailable',
      observed_at: null,
      retrieved_at: new Date().toISOString(),
      data_type: 'unavailable',
      is_stale: true,
      is_demo: false,
      station_distance_km: null,
      data_freshness: 'unknown',
    },
  };
}

export const airQualityService = {
  getCurrentAir: async (city?: string, lat?: number, lng?: number): Promise<AirQualityData> => {
    try {
      const res = await api.get('/air/current', { params: { city, lat, lng } });
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend unavailable, using demo baseline data:', err);
    }

    const cityKey = (city || 'delhi').toLowerCase();
    if (FALLBACK_AIR_DATA[cityKey]) {
      return FALLBACK_AIR_DATA[cityKey];
    }

    return createUnavailableResponse(city, lat, lng);
  },

  getStations: async (city?: string): Promise<Station[]> => {
    try {
      const res = await api.get('/air/stations', { params: { city } });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend unavailable, using demo station data:', err);
    }

    if (city && city.trim()) {
      const targetCity = city.trim().toLowerCase();
      return FALLBACK_STATIONS.filter((s) => s.city.toLowerCase() === targetCity);
    }

    return FALLBACK_STATIONS;
  },

  getForecast: async (lat?: number, lng?: number, days = 3): Promise<ForecastPoint[] | null> => {
    try {
      const res = await api.get('/air/forecast', { params: { lat, lng, days } });
      if (res.data?.data?.forecast) {
        return res.data.data.forecast;
      }
    } catch {
      console.warn('Forecast unavailable');
    }
    return null;
  },
};