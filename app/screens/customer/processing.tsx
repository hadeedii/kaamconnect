import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { executeSearchPipeline } from '../../../agents';
import { AgentContext } from '../../../agents/types';
import CompassLoader from '@/components/CompassLoader';

interface AgentStep {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export default function ProcessingScreen() {
  const router = useRouter();
  const { query } = useLocalSearchParams<{ query: string }>();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = rootNavigationState?.key !== undefined;

  const [steps, setSteps] = useState<AgentStep[]>([
    { id: 'intent', name: 'Understanding request', description: 'Extracting service type and urgency...', status: 'idle' },
    { id: 'location', name: 'Detecting location', description: 'Pinpointing sector coordinates...', status: 'idle' },
    { id: 'discovery', name: 'Finding nearby providers', description: 'Querying available professionals...', status: 'idle' },
    { id: 'ranking', name: 'Ranking providers', description: 'Sorting by score and rating...', status: 'idle' }
  ]);

  const [agentContext, setAgentContext] = useState<AgentContext | null>(null);

  useEffect(() => {
    if (!query) return;

    const runPipeline = async () => {
      try {
        // Run with callbacks to animate the UI steps
        const finalContext = await executeSearchPipeline(query, (stepName, updatedCtx) => {
          setSteps(prev => prev.map(s => {
            if (s.id === stepName) {
              return { ...s, status: 'completed' };
            }
            const nextStepMap: Record<string, string> = {
              intent: 'location',
              location: 'discovery',
              discovery: 'ranking',
            };
            if (s.id === nextStepMap[stepName]) {
              return { ...s, status: 'running' };
            }
            return s;
          }));
          setAgentContext(updatedCtx);
        });

        // Pipeline ends, wait a second and push to Nearby screen safely
        setTimeout(() => {
          const navigateToNearby = () => {
            router.push({
              pathname: '/screens/customer/nearby' as any,
              params: { contextJson: JSON.stringify(finalContext) }
            });
          };

          if (isNavigationReady) {
            navigateToNearby();
          } else {
            // Fallback: poll until navigation stack is ready
            const interval = setInterval(() => {
              if (rootNavigationState?.key !== undefined) {
                clearInterval(interval);
                navigateToNearby();
              }
            }, 100);
          }
        }, 1200);

      } catch (error) {
        console.error("AI processing pipeline failed", error);
        setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'failed' } : s));
      }
    };

    // Set first step running
    setSteps(prev => prev.map((s, idx) => idx === 0 ? { ...s, status: 'running' } : s));
    runPipeline();
  }, [query]);



  const runningStep = steps.find(s => s.status === 'running');
  const loadingMessage = runningStep ? runningStep.name : 'Orchestrating...';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Agent Orchestrator</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.queryTitle}>Processing Request</Text>
          <Text style={styles.queryText}>"{query}"</Text>
        </View>

        <View style={styles.centerContainer}>
          <CompassLoader message={loadingMessage} />
          
          <Text style={styles.graphicTitle}>Finding the Perfect Match</Text>
          <Text style={styles.graphicDesc}>
            Our AI Search Agent is matching your request with nearby specialists directly in the database.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  circularBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  queryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  graphicTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  graphicDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
