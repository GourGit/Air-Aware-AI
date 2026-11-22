import api from './api';

export const routineService = {
  getToday: async () => {
    const res = await api.get('/routines/today');
    return res.data.data;
  },
  generate: async (city?: string) => {
    const res = await api.post('/routines/generate', { city });
    return res.data.data;
  },
  toggleComplete: async (routineId: string, itemId: string) => {
    const res = await api.post(`/routines/${routineId}/items/${itemId}/complete`);
    return res.data;
  },
};

export const indoorService = {
  getGuidance: async () => {
    const res = await api.get('/indoor/guidance');
    return res.data.data;
  },
  submitAssessment: async (data: any) => {
    const res = await api.post('/indoor/assessment', data);
    return res.data.data;
  },
  getChecklists: async () => {
    const res = await api.get('/indoor/checklists');
    return res.data.data;
  },
};

export const mobilityService = {
  compare: async (distanceKm: number, origin: string, destination: string) => {
    const res = await api.post('/mobility/compare', {
      distance_km: distanceKm,
      origin,
      destination,
    });
    return res.data.data;
  },
  getHistory: async () => {
    const res = await api.get('/mobility/history');
    return res.data.data;
  },
  logRecord: async (record: any) => {
    const res = await api.post('/mobility/records', record);
    return res.data.data;
  },
};

export const impactService = {
  getSummary: async () => {
    const res = await api.get('/impact/summary');
    return res.data.data;
  },
};

export const communityService = {
  getReports: async () => {
    const res = await api.get('/community/reports');
    return res.data.data;
  },
  submitReport: async (report: any) => {
    const res = await api.post('/community/reports', report);
    return res.data.data;
  },
};
