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
import type { ChatMessage } from '../types';

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I am your AirAware AI assistant powered by LangGraph multi-agent intelligence. How can I help with your routine, transit, or air quality questions today?',
      timestamp: 'Just now',
      agent: 'CoordinatorAgent',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/message', {
        message: userMsg.content,
        user_context: { city: 'Delhi', user_id: 'mobile-user' },
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.response || res.data.message || 'Here is the environmental recommendation for your area.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent: res.data.agent_name || 'SynthesizerAgent',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Graceful offline mock response
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on current Delhi conditions (AQI 342 - Very Poor), I recommend shifting strenuous outdoor workouts indoors. If commuting, opting for Delhi Metro instead of a private car avoids approx 320g of CO2e and reduces exposure to roadside ultrafine particles.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent: 'RoutineAgent',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
            ]}
          >
            {item.agent && (
              <Text style={styles.agentBadge}>{item.agent}</Text>
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
          onPress={sendMessage}
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
  agentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#25B89A',
    marginBottom: 4,
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
