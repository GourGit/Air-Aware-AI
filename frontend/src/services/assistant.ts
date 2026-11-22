import api from './api';

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  intent: string;
  supporting_data: Record<string, any>;
  recommendations: string[];
  limitations?: string;
  sources: string[];
  observed_at: string;
  agents_used: string[];
}

export const assistantService = {
  sendMessage: async (
    message: string,
    conversation_id?: string,
    city?: string,
    latitude?: number,
    longitude?: number
  ): Promise<ChatResponse> => {
    const res = await api.post('/assistant/chat', {
      message,
      conversation_id,
      city,
      latitude,
      longitude,
    });
    return res.data.data;
  },
};
