import { useState } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assistantService, type ChatResponse } from '@/services/assistant';

interface Message {
  sender: 'user' | 'assistant';
  content: string;
  metadata?: any;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      content:
        "Hello! I am AirAware AI, your environmental intelligence companion. Ask me anything about current AQI levels, morning exercise safety, indoor air filtration, or sustainable transit in Indian cities.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    setInput('');
    const userMsg: Message = { sender: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res: ChatResponse = await assistantService.sendMessage(text, conversationId);
      setConversationId(res.conversation_id);
      const botMsg: Message = {
        sender: 'assistant',
        content: res.answer,
        metadata: {
          intent: res.intent,
          supporting_data: res.supporting_data,
          recommendations: res.recommendations,
          sources: res.sources,
          limitations: res.limitations,
          agents_used: res.agents_used,
        },
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          content: 'Unable to reach the multi-agent orchestrator. Please check your connection and retry.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Is it safe to run outdoors this morning in Delhi?',
    'How should I ventilate my apartment when AQI is 250?',
    'Compare carbon emissions between metro and car commute',
    'What does the current PM2.5 level mean for health?',
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border dark:border-forest/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-mint uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LangGraph Multi-Agent Environmental Assistant</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-display text-charcoal dark:text-white mt-0.5">
              Environmental AI Consultation
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([messages[0]]);
              setConversationId(undefined);
            }}
            className="text-xs"
          >
            Clear Thread
          </Button>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-mint text-white'
                    : 'bg-charcoal dark:bg-forest/40 text-mint border border-mint/30'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-mint text-white rounded-tr-none'
                    : 'bg-muted dark:bg-forest/15 border border-border dark:border-forest/30 text-charcoal dark:text-mist rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

                {/* Sub-agent outputs metadata */}
                {m.metadata && (
                  <div className="mt-3 pt-3 border-t border-border/80 dark:border-forest/30 text-xs space-y-2">
                    {m.metadata.recommendations && m.metadata.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-mint font-semibold">Key Recommendations:</strong>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {m.metadata.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] text-slate">
                      <span>Intent: <strong>{m.metadata.intent}</strong></span>
                      <span>•</span>
                      <span>Agents: <strong>{m.metadata.agents_used?.join(', ')}</strong></span>
                      {m.metadata.sources && (
                        <>
                          <span>•</span>
                          <span>Source: {m.metadata.sources[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate p-2 animate-pulse">
              <Bot className="w-4 h-4 text-mint" />
              <span>Orchestrating specialized agents and retrieving station observations...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="px-3 py-1.5 rounded-lg border border-border dark:border-forest/40 bg-white dark:bg-charcoal text-xs text-slate hover:text-charcoal dark:hover:text-white hover:border-mint transition-colors whitespace-nowrap shrink-0"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about air quality, running safety, indoor purifiers, transit..."
            className="flex-1"
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-mint hover:bg-mint/90 text-white gap-2 px-5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>

        <p className="text-[10px] text-center text-slate">
          AirAware AI provides general environmental advice based on ambient monitoring stations. Not a substitute for clinical medical advice.
        </p>
      </div>
    </AppLayout>
  );
}
