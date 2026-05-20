import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AgentLog } from '../../../agents/types';

export default function AgentLogsScreen() {
  const router = useRouter();
  const { logsJson } = useLocalSearchParams<{ logsJson: string }>();
  
  const logs: AgentLog[] = logsJson ? JSON.parse(logsJson) : [];
  const [expandedLog, setExpandedLog] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedLog(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getStatusColor = (status: AgentLog['status']) => {
    switch (status) {
      case 'success': return '#10B981'; // Green
      case 'failed': return '#EF4444'; // Red
      default: return '#3B82F6'; // Blue
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Dark Theme Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orchestrator Logs</Text>
        <View style={styles.terminalIconWrapper}>
          <Ionicons name="terminal-outline" size={20} color="#10B981" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.logList}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="code-working-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No logs generated for this session yet.</Text>
          </View>
        ) : (
          logs.map((log, index) => {
            const isExpanded = !!expandedLog[index];
            const statusColor = getStatusColor(log.status);
            
            return (
              <View key={index} style={styles.logCard}>
                {/* Card Header */}
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  onPress={() => toggleExpand(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.agentTagRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={styles.agentName}>[{log.agentName}]</Text>
                  </View>
                  
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>

                {/* Main Message */}
                <Text style={styles.logMessage}>{log.message}</Text>
                
                <Text style={styles.timestamp}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>

                {/* Collapsible Details */}
                {isExpanded && log.details && (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>PAYLOAD / DECISION TRACE:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Text style={styles.codeText}>{log.details}</Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep slate terminal black
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  terminalIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  logList: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  agentTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  agentName: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8', // Cyan
    fontWeight: '700',
    fontSize: 13,
  },
  logMessage: {
    color: '#E2E8F0',
    fontSize: 13.5,
    lineHeight: 18,
    marginTop: 4,
  },
  timestamp: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
  },
  detailsTitle: {
    color: '#10B981', // green
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#CBD5E1',
    fontSize: 11.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#64748B',
    marginTop: 12,
  },
});
