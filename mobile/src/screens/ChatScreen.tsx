import React, { useState } from 'react';
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
} from 'react-native';
import api from '../config/api';
import { useChatStore } from '../store/chatStore';
import { useMobileAuthStore } from '../store/authStore';
import type { ChatMessage } from '../types';

export default function ChatScreen() {
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const user = useMobileAuthStore((state) => state.user);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;

    // Capture originating user ID when sending the message
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
      const res = await api.post('/chat/message', {
        message: textToSend,
        user_context: {
          city: 'Delhi',
          user_id: originatingUserId,
          user_email: user?.email,
        },
      });

      // Verify account has not changed across request lifecycle before writing response
      const currentActiveUserId = useMobileAuthStore.getState().user?.id || 'anonymous';
      if (currentActiveUserId !== originatingUserId) {
        console.warn('Account session changed during pending chat request; discarding response.');
        return;
      }

      // Extract response from top-level or enveloped backend payloads
      let responseContent = 'Environmental guidance retrieved.';
      if (res.data) {
        if (typeof res.data.response === 'string') {
          responseContent = res.data.response;
        } else if (typeof res.data.message === 'string') {
          responseContent = res.data.message;
        } else if (res.data.data) {
          if (typeof res.data.data.response === 'string') {
            responseContent = res.data.data.response;
          } else if (typeof res.data.data.message === 'string') {
            responseContent = res.data.data.message;
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent: res.data.agent_name || res.data.data?.agent_name || 'SynthesizerAgent',
      };
      addMessage(assistantMsg);
    } catch (err) {
      console.warn('Chat assistant request failed:', err);
      // Only set error on current active user
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
          placeholder="Ask about air quality, running safely..."
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
});
