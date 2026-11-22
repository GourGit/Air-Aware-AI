import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I am your AirAware AI assistant powered by LangGraph multi-agent intelligence. How can I help with your routine, transit, or air quality questions today?',
      timestamp: 'Just now',
      agent: 'CoordinatorAgent',
    },
  ],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
}));
