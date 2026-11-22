import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import ChatScreen from '../screens/ChatScreen';
import RoutineScreen from '../screens/RoutineScreen';
import IndoorAirScreen from '../screens/IndoorAirScreen';
import MobilityScreen from '../screens/MobilityScreen';
import ImpactScreen from '../screens/ImpactScreen';
import CommunityScreen from '../screens/CommunityScreen';
import AuthScreen from '../screens/AuthScreen';
import { useMobileAuthStore } from '../store/authStore';

export type TabKey = 'dashboard' | 'assistant' | 'routine' | 'mobility' | 'indoor' | 'impact' | 'community';

export default function AppNavigator() {
  const isAuthenticated = useMobileAuthStore((state) => state.isAuthenticated);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'assistant':
        return <ChatScreen />;
      case 'routine':
        return <RoutineScreen />;
      case 'mobility':
        return <MobilityScreen />;
      case 'indoor':
        return <IndoorAirScreen />;
      case 'impact':
        return <ImpactScreen />;
      case 'community':
        return <CommunityScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const navTabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Air', icon: '🌬️' },
    { key: 'assistant', label: 'AI Chat', icon: '💬' },
    { key: 'routine', label: 'Routine', icon: '📅' },
    { key: 'mobility', label: 'Mobility', icon: '🚇' },
    { key: 'indoor', label: 'Indoor', icon: '🏠' },
    { key: 'impact', label: 'Impact', icon: '🌱' },
    { key: 'community', label: 'Report', icon: '📢' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F7',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#DCE6E2',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#25B89A15',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71818A',
  },
  tabLabelActive: {
    color: '#25B89A',
    fontWeight: '800',
  },
});
