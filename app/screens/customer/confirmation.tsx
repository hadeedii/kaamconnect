import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TimelineEvent {
  id: string;
  title: string;
  timeText: string;
  status: 'pending' | 'active' | 'completed';
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    providerName: string;
    serviceType: string;
    price: string;
    time: string;
  }>();

  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { id: '1', title: 'Booking Confirmed & ID Generated', timeText: 'Just Now', status: 'completed' },
    { id: '2', title: 'Provider Assigned & Dispatched', timeText: 'In 2 mins', status: 'active' },
    { id: '3', title: 'Service Job In Progress', timeText: 'Scheduled Time', status: 'pending' },
    { id: '4', title: 'Feedback Request & Invoice', timeText: 'Post Service', status: 'pending' }
  ]);

  // Simulate progress of autonomous orchestration workflow
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setTimeline(prev => prev.map(item => {
        if (item.id === '2') return { ...item, status: 'completed', timeText: 'Completed' };
        if (item.id === '3') return { ...item, status: 'active' };
        return item;
      }));
    }, 4000);

    const timer2 = setTimeout(() => {
      setTimeline(prev => prev.map(item => {
        if (item.id === '3') return { ...item, status: 'completed', timeText: 'Completed' };
        if (item.id === '4') return { ...item, status: 'active' };
        return item;
      }));
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Top Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.replace('/(tabs)/customer/home')}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Confirmation</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Animated Check */}
        <View style={styles.successContainer}>
          <View style={styles.successPulse}>
            <View style={styles.successBg}>
              <Ionicons name="checkmark-done" size={48} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>Your AI assistant scheduled the service autonomously.</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{params.bookingId || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{params.serviceType || 'Home Service'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned Provider</Text>
            <Text style={styles.detailValue}>{params.providerName || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Payable</Text>
            <Text style={styles.detailValue}>Rs. {params.price || '0'}</Text>
          </View>
        </View>

        {/* Autonomous Followup Workflow timeline */}
        <Text style={styles.sectionTitle}>Autonomous Execution Timeline</Text>
        <View style={styles.timelineContainer}>
          {timeline.map((item, index) => {
            const isLast = index === timeline.length - 1;
            return (
              <View key={item.id} style={styles.timelineRow}>
                <View style={styles.timelineIndicator}>
                  <View style={[
                    styles.timelineDot,
                    item.status === 'completed' && styles.dotCompleted,
                    item.status === 'active' && styles.dotActive
                  ]}>
                    {item.status === 'completed' && (
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    )}
                  </View>
                  {!isLast && <View style={[styles.timelineLine, item.status === 'completed' && styles.lineCompleted]} />}
                </View>

                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineTitle,
                    item.status === 'completed' && styles.titleCompleted,
                    item.status === 'active' && styles.titleActive
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={styles.timelineTime}>{item.timeText}</Text>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)/customer/home')}
        >
          <Text style={styles.homeBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
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
    padding: 24,
    alignItems: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  successPulse: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    alignSelf: 'flex-start',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineRow: {
    flexDirection: 'row',
    height: 60,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dotActive: {
    borderColor: '#5271FF',
    backgroundColor: '#5271FF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: '#10B981',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  titleCompleted: {
    color: '#1E293B',
  },
  titleActive: {
    color: '#5271FF',
  },
  timelineTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  homeBtn: {
    backgroundColor: '#5271FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
