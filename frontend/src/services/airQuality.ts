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
    status: string; // 'live' | 'sample' | 'unavailable'
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
  is_sample?: boolean;
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
  is_sample?: boolean;
}

const FALLBACK_AIR_DATA: Record<string, AirQualityData> = {
  delhi: {
    location: {
      name: 'Anand Vihar, Delhi — DPCC (Sample)',
      city: 'Delhi',
      state: 'Delhi',
      latitude: 28.6508,
      longitude: 77.3152,
      station_id: 'delhi-anand-vihar',
    },
    air_quality: {
      aqi: 342,
      category: 'Very Poor',
      color: '#CC0033',
      prominent_pollutant: 'pm25',
      standard: 'CPCB NAQI (India)',
      status: 'sample',
    },
    pollutants: {
      pm25: { value: 178.0, unit: 'µg/m³', sub_index: 342 },
      pm10: { value: 292.0, unit: 'µg/m³', sub_index: 242 },
      no2: { value: 68.0, unit: 'µg/m³', sub_index: 85 },
      so2: { value: 19.5, unit: 'µg/m³', sub_index: 24 },
      co: { value: 1.9, unit: 'mg/m³', sub_index: 95 },
      o3: { value: 38.0, unit: 'µg/m³', sub_index: 38 },
    },
    health_advisory: {
      summary: 'Sample Demonstration: Thermal inversion conditions typically elevate particulate concentrations.',
      precautions: [
        'Avoid intense outdoor workouts during morning peaks',
        'Wear N95/FFP2 respirator when commuting',
        'Operate indoor HEPA air purification',
      ],
    },
    metadata: {
      source: 'Official CPCB Historical Profile (Sample Data)',
      observed_at: '',
      retrieved_at: '',
    },
    is_sample: true,
  },
  mumbai: {
    location: {
      name: 'Bandra Kurla Complex, Mumbai — MPCB (Sample)',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0657,
      longitude: 72.8687,
      station_id: 'mumbai-bkc',
    },
    air_quality: {
      aqi: 185,
      category: 'Moderate',
      color: '#FFCC00',
      prominent_pollutant: 'pm10',
      standard: 'CPCB NAQI (India)',
      status: 'sample',
    },
    pollutants: {
      pm25: { value: 68.0, unit: 'µg/m³', sub_index: 127 },
      pm10: { value: 172.0, unit: 'µg/m³', sub_index: 185 },
      no2: { value: 45.0, unit: 'µg/m³', sub_index: 56 },
      so2: { value: 12.0, unit: 'µg/m³', sub_index: 15 },
      co: { value: 1.1, unit: 'mg/m³', sub_index: 55 },
      o3: { value: 28.0, unit: 'µg/m³', sub_index: 28 },
    },
    health_advisory: {
      summary: 'Sample Demonstration: Moderate air quality with coastal breeze dispersion.',
      precautions: [
        'Sensitive groups may experience minor discomfort',
        'Normal outdoor activities permissible',
      ],
    },
    metadata: {
      source: 'Official CPCB Historical Profile (Sample Data)',
      observed_at: '',
      retrieved_at: '',
    },
    is_sample: true,
  },
  bengaluru: {
    location: {
      name: 'BTM Layout / Silk Board, Bengaluru — KSPCB (Sample)',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9166,
      longitude: 77.6101,
      station_id: 'bengaluru-silk-board',
    },
    air_quality: {
      aqi: 82,
      category: 'Satisfactory',
      color: '#99CC33',
      prominent_pollutant: 'pm25',
      standard: 'CPCB NAQI (India)',
      status: 'sample',
    },
    pollutants: {
      pm25: { value: 29.0, unit: 'µg/m³', sub_index: 48 },
      pm10: { value: 64.0, unit: 'µg/m³', sub_index: 64 },
      no2: { value: 28.0, unit: 'µg/m³', sub_index: 35 },
      so2: { value: 8.5, unit: 'µg/m³', sub_index: 11 },
      co: { value: 0.6, unit: 'mg/m³', sub_index: 30 },
      o3: { value: 22.0, unit: 'µg/m³', sub_index: 22 },
    },
    health_advisory: {
      summary: 'Sample Demonstration: Satisfactory air quality across plateau region.',
      precautions: ['Air quality is generally acceptable for the general public.'],
    },
    metadata: {
      source: 'Official CPCB Historical Profile (Sample Data)',
      observed_at: '',
      retrieved_at: '',
    },
    is_sample: true,
  },
  kolkata: {
    location: {
      name: 'Salt Lake / Sector 5, Kolkata — WBPCB (Sample)',
      city: 'Kolkata',
      state: 'West Bengal',
      latitude: 22.5802,
      longitude: 88.4272,
      station_id: 'kolkata-salt-lake',
    },
    air_quality: {
      aqi: 225,
      category: 'Poor',
      color: '#FF9933',
      prominent_pollutant: 'pm25',
      standard: 'CPCB NAQI (India)',
      status: 'sample',
    },
    pollutants: {
      pm25: { value: 112.0, unit: 'µg/m³', sub_index: 225 },
      pm10: { value: 198.0, unit: 'µg/m³', sub_index: 165 },
      no2: { value: 52.0, unit: 'µg/m³', sub_index: 65 },
      so2: { value: 16.0, unit: 'µg/m³', sub_index: 20 },
      co: { value: 1.4, unit: 'mg/m³', sub_index: 70 },
      o3: { value: 31.0, unit: 'µg/m³', sub_index: 31 },
    },
    health_advisory: {
      summary: 'Sample Demonstration: Breathing discomfort to people with prolonged exposure.',
      precautions: ['Reduce prolonged or heavy outdoor exertion.'],
    },
    metadata: {
      source: 'Official CPCB Historical Profile (Sample Data)',
      observed_at: '',
      retrieved_at: '',
    },
    is_sample: true,
  },
  chennai: {
    location: {
      name: 'Alandur / Chennai Airport, Chennai — TNPCB (Sample)',
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 12.9975,
      longitude: 80.1915,
      station_id: 'chennai-alandur',
    },
    air_quality: {
      aqi: 68,
      category: 'Satisfactory',
      color: '#99CC33',
      prominent_pollutant: 'pm10',
      standard: 'CPCB NAQI (India)',
      status: 'sample',
    },
    pollutants: {
      pm25: { value: 24.0, unit: 'µg/m³', sub_index: 40 },
      pm10: { value: 58.0, unit: 'µg/m³', sub_index: 58 },
      no2: { value: 22.0, unit: 'µg/m³', sub_index: 28 },
      so2: { value: 9.0, unit: 'µg/m³', sub_index: 11 },
      co: { value: 0.5, unit: 'mg/m³', sub_index: 25 },
      o3: { value: 19.0, unit: 'µg/m³', sub_index: 19 },
    },
    health_advisory: {
      summary: 'Sample Demonstration: Clean coastal dispersion.',
      precautions: ['Ideal conditions for outdoor activity.'],
    },
    metadata: {
      source: 'Official CPCB Historical Profile (Sample Data)',
      observed_at: '',
      retrieved_at: '',
    },
    is_sample: true,
  },
  lucknow: {
    location: {
      name: 'Talkatora Industrial Area, Lucknow — UPPCB (Sample)',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      latitude: 26.8322,
      longitude: 80.9011,
      station_id: 'lucknow-talkatora',
    },
    air_quality: {
      aqi: 312,
      category: 'Very Poor',
      color: '#CC0033',
      prominent_pollutant: 'pm25',
      standard: 'CPCB NAQI (India)',
      status: 'sample',
    },
    pollutants: {
      pm25: { value: 162.0, unit: 'µg/m³', sub_index: 312 },
      pm10: { value: 275.0, unit: 'µg/m³', sub_index: 225 },
      no2: { value: 61.0, unit: 'µg/m³', sub_index: 76 },
      so2: { value: 18.0, unit: 'µg/m³', sub_index: 22 },
      co: { value: 1.8, unit: 'mg/m³', sub_index: 90 },
      o3: { value: 35.0, unit: 'µg/m³', sub_index: 35 },
    },
    health_advisory: {
      summary: 'Sample Demonstration: Industrial basin dispersion limit.',
      precautions: ['Avoid prolonged outdoor exposure.'],
    },
    metadata: {
      source: 'Official CPCB Historical Profile (Sample Data)',
      observed_at: '',
      retrieved_at: '',
    },
    is_sample: true,
  },
};

const FALLBACK_STATIONS: Station[] = [
  {
    id: 'sta-sample-1',
    name: 'Anand Vihar, Delhi — DPCC (Sample)',
    city: 'Delhi',
    state: 'Delhi',
    agency: 'Delhi Pollution Control Committee',
    latitude: 28.6508,
    longitude: 77.3152,
    aqi: 342,
    category: 'Very Poor',
    color: '#CC0033',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 178, pm10: 292, no2: 68, so2: 19.5, co: 1.9, o3: 38 },
    last_updated: '',
    source: 'Official CAAQMS Historical Profile (Sample Data)',
    is_sample: true,
  },
  {
    id: 'sta-sample-2',
    name: 'Bandra Kurla Complex, Mumbai — MPCB (Sample)',
    city: 'Mumbai',
    state: 'Maharashtra',
    agency: 'Maharashtra PCB',
    latitude: 19.0657,
    longitude: 72.8687,
    aqi: 185,
    category: 'Moderate',
    color: '#FFCC00',
    prominent_pollutant: 'pm10',
    pollutants: { pm25: 68, pm10: 172, no2: 45, so2: 12.0, co: 1.1, o3: 28 },
    last_updated: '',
    source: 'Official CAAQMS Historical Profile (Sample Data)',
    is_sample: true,
  },
  {
    id: 'sta-sample-3',
    name: 'BTM Layout / Silk Board, Bengaluru — KSPCB (Sample)',
    city: 'Bengaluru',
    state: 'Karnataka',
    agency: 'Karnataka SPCB',
    latitude: 12.9166,
    longitude: 77.6101,
    aqi: 82,
    category: 'Satisfactory',
    color: '#99CC33',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 29, pm10: 64, no2: 28, so2: 8.5, co: 0.6, o3: 22 },
    last_updated: '',
    source: 'Official CAAQMS Historical Profile (Sample Data)',
    is_sample: true,
  },
  {
    id: 'sta-sample-4',
    name: 'Salt Lake / Sector 5, Kolkata — WBPCB (Sample)',
    city: 'Kolkata',
    state: 'West Bengal',
    agency: 'West Bengal PCB',
    latitude: 22.5802,
    longitude: 88.4272,
    aqi: 225,
    category: 'Poor',
    color: '#FF9933',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 112, pm10: 198, no2: 52, so2: 16.0, co: 1.4, o3: 31 },
    last_updated: '',
    source: 'Official CAAQMS Historical Profile (Sample Data)',
    is_sample: true,
  },
  {
    id: 'sta-sample-5',
    name: 'Alandur / Chennai Airport, Chennai — TNPCB (Sample)',
    city: 'Chennai',
    state: 'Tamil Nadu',
    agency: 'Tamil Nadu PCB',
    latitude: 12.9975,
    longitude: 80.1915,
    aqi: 68,
    category: 'Satisfactory',
    color: '#99CC33',
    prominent_pollutant: 'pm10',
    pollutants: { pm25: 24, pm10: 58, no2: 22, so2: 9.0, co: 0.5, o3: 19 },
    last_updated: '',
    source: 'Official CAAQMS Historical Profile (Sample Data)',
    is_sample: true,
  },
  {
    id: 'sta-sample-6',
    name: 'Talkatora Industrial Area, Lucknow — UPPCB (Sample)',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    agency: 'UP Pollution Control Board',
    latitude: 26.8322,
    longitude: 80.9011,
    aqi: 312,
    category: 'Very Poor',
    color: '#CC0033',
    prominent_pollutant: 'pm25',
    pollutants: { pm25: 162, pm10: 275, no2: 61, so2: 18.0, co: 1.8, o3: 35 },
    last_updated: '',
    source: 'Official CAAQMS Historical Profile (Sample Data)',
    is_sample: true,
  },
];

export const airQualityService = {
  getCurrentAir: async (city?: string, lat?: number, lng?: number): Promise<AirQualityData> => {
    try {
      const res = await api.get('/air/current', { params: { city, lat, lng } });
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend unavailable, selecting sample baseline data:', err);
    }

    const cityKey = (city || 'delhi').toLowerCase();
    if (FALLBACK_AIR_DATA[cityKey]) {
      return FALLBACK_AIR_DATA[cityKey];
    }

    // Explicit unavailable response when city has no matched fallback — never silently substitute Delhi!
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
        aqi: 0,
        category: 'Data Unavailable',
        color: '#71818A',
        prominent_pollutant: 'N/A',
        standard: 'CPCB NAQI',
        status: 'unavailable',
      },
      pollutants: {},
      health_advisory: {
        summary: `Real-time CPCB monitoring data for ${city || 'this location'} is currently unavailable.`,
        precautions: ['Please select a supported monitoring city or check network connection.'],
      },
      metadata: {
        source: 'Data Unavailable',
        observed_at: '',
        retrieved_at: '',
      },
      is_sample: true,
    };
  },

  getStations: async (city?: string): Promise<Station[]> => {
    try {
      const res = await api.get('/air/stations', { params: { city } });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend unavailable, using sample station coordinates:', err);
    }

    if (city && city.trim()) {
      const targetCity = city.trim().toLowerCase();
      // Only return stations matching the city; return empty array if none match
      return FALLBACK_STATIONS.filter((s) => s.city.toLowerCase() === targetCity);
    }

    // Return full list only for unfiltered request
    return FALLBACK_STATIONS;
  },

  getForecast: async (lat?: number, lng?: number, days: number = 3) => {
    try {
      const res = await api.get('/air/forecast', { params: { lat, lng, days } });
      return res.data.data;
    } catch {
      return null;
    }
  },
};
