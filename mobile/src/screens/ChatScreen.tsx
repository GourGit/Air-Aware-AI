import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { chatApi, handleApiError } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { useMobileAuthStore } from '../store/authStore';
import type { ChatMessage, ChatMessageMetadata } from '../types';

export default function ChatScreen() {
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const user = useMobileAuthStore((state) => state.user);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const hasWelcome = messages.some((m) => m.role === 'assistant' && m.agent === 'CoordinatorAgent');
    if (!hasWelcome) {
      addMessage({
        id: '1',
        role: 'assistant',
        content:
          'Hello! I am your AirAware AI assistant powered by LangGraph multi-agent intelligence. How can I help with your routine, transit, or air quality questions today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent: 'CoordinatorAgent',
      });
    }
  }, [messages, addMessage]);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const textToSend = overrideText || input;
      if (!textToSend.trim() || loading) return;

      const originatingUserId = user?.id || 'anonymous';

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (!overrideText) {
        addMessage(userMsg);
        setInput('');
      }
      setLoading(true);
      setLastFailedMessage(null);

      try {
        const location = { city: 'Delhi', latitude: 28.6139, longitude: 77.209 };

        const res = await chatApi.sendMessage({
          conversation_id: conversationId || undefined,
          message: textToSend,
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
        });

        const currentActiveUserId = useMobileAuthStore.getState().user?.id || 'anonymous';
        if (currentActiveUserId !== originatingUserId) {
          console.warn('Account session changed during pending chat request; discarding response.');
          return;
        }

        setConversationId(res.conversation_id);

        const metadata: ChatMessageMetadata = {
          intent: res.intent,
          recommendations: res.recommendations,
          sources: res.sources,
          limitations: res.limitations,
          observed_at: res.observed_at,
          agents_used: res.agents_used,
        };

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agent: res.agents_used?.[res.agents_used.length - 1] || 'SynthesizerAgent',
          metadata,
        };
        addMessage(assistantMsg);
      } catch (err) {
        console.warn('Chat assistant request failed:', err);
        const currentActiveUserId = useMobileAuthStore.getState().user?.id || 'anonymous';
        if (currentActiveUserId === originatingUserId) {
          setLastFailedMessage(textToSend);
          const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content:
              'Service is currently unavailable. Unable to reach live LangGraph agent backend. Please check connection and tap Retry below.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agent: 'SystemAlert',
          };
          addMessage(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    },
    [input, loading, user, conversationId, addMessage]
  );

  const handleNewConversation = () => {
    setConversationId(null);
    useChatStore.getState().clearMessages();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>LangGraph AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Multi-Agent Urban Environmental Advisory</Text>
        <TouchableOpacity style={styles.newChatBtn} onPress={handleNewConversation} disabled={loading}>
          <Text style={styles.newChatBtnText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              item.agent === 'SystemAlert' && styles.alertBubble,
            ]}
          >
            {item.agent && (
              <Text
                style={[
                  styles.agentBadge,
                  item.agent === 'SystemAlert' && styles.alertBadge,
                ]}
              >
                {item.agent}
              </Text>
            )}
            <Text
              style={[
                styles.messageText,
                item.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {item.content}
            </Text>
            {item.metadata && (
              <View style={styles.metadata}>
                {item.metadata.sources && item.metadata.sources.length > 0 && (
                  <Text style={styles.metaText}>Source: {item.metadata.sources[0]}</Text>
                )}
                {item.metadata.observed_at && (
                  <Text style={styles.metaText}>Observed: {new Date(item.metadata.observed_at).toLocaleString()}</Text>
                )}
              </View>
            )}
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        )}
      />

      {lastFailedMessage && (
        <View style={styles.retryBar}>
          <Text style={styles.retryText}>Last request failed.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => sendMessage(lastFailedMessage)}
            disabled={loading}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about air quality, running safety, indoor purifiers, transit..."
          placeholderTextColor="#71818A"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        AirAware AI provides general environmental advice based on ambient monitoring stations. Not a substitute for clinical medical advice.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F7',
  },
  topHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#DCE6E2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101B20',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#71818A',
  },
  newChatBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F8F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  newChatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#25B89A',
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#25B89A',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  alertBubble: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  agentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#25B89A',
    marginBottom: 4,
  },
  alertBadge: {
    color: '#DC2626',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#101B20',
  },
  timestamp: {
    fontSize: 10,
    color: '#71818A',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  metadata: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metaText: {
    fontSize: 10,
    color: '#71818A',
    marginBottom: 2,
  },
  retryBar: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#EF4444',
  },
  retryText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#DCE6E2',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F8F7',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#101B20',
  },
  sendButton: {
    backgroundColor: '#25B89A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    color: '#71818A',
    padding: 12,
  },
});